// --- State ---

// Load saved progress from localStorage (or start fresh)
function loadProgress() {
  const saved = localStorage.getItem("quest-progress");
  return saved ? JSON.parse(saved) : {};
}

function saveProgress(progress) {
  localStorage.setItem("quest-progress", JSON.stringify(progress));
}

let questData = [];
let progress = loadProgress(); // { "ranni-1": true, "alex-3": true, ... }
let currentView = "list"; // "list" or "detail"
let currentQuestId = null;

// --- Rendering ---

const content = document.getElementById("content");

function getQuestProgress(quest) {
  const completed = quest.steps.filter((s) => progress[s.id]).length;
  return { completed, total: quest.steps.length };
}

function renderQuestList() {
  currentView = "list";
  currentQuestId = null;

  // Calculate overall stats
  const totalSteps = questData.reduce((sum, q) => sum + q.steps.length, 0);
  const completedSteps = questData.reduce(
    (sum, q) => sum + q.steps.filter((s) => progress[s.id]).length,
    0
  );
  const completedQuests = questData.filter((q) => {
    const { completed, total } = getQuestProgress(q);
    return completed === total && total > 0;
  }).length;
  const overallPercent = Math.round((completedSteps / totalSteps) * 100);

  const html = `
    <div class="dashboard">
      <div class="dashboard__stats">
        <div class="stat">
          <span class="stat__value">${overallPercent}%</span>
          <span class="stat__label">Overall</span>
        </div>
        <div class="stat">
          <span class="stat__value">${completedQuests}/${questData.length}</span>
          <span class="stat__label">Quests</span>
        </div>
        <div class="stat">
          <span class="stat__value">${completedSteps}/${totalSteps}</span>
          <span class="stat__label">Steps</span>
        </div>
      </div>
      <div class="progress-bar progress-bar--large">
        <div class="progress-bar__fill" style="width: ${overallPercent}%"></div>
      </div>
    </div>
    <div class="quest-grid">
      ${questData
        .map((quest) => {
          const { completed, total } = getQuestProgress(quest);
          const percent = Math.round((completed / total) * 100);
          const isDone = completed === total;

          return `
          <button class="quest-card ${isDone ? "quest-card--done" : ""}" data-quest-id="${quest.id}">
            <div class="quest-card__category">${quest.category === "major" ? "Major Quest" : "Side Quest"}</div>
            <h2 class="quest-card__name">${quest.npc}</h2>
            <p class="quest-card__location">${quest.location}</p>
            <p class="quest-card__desc">${quest.description}</p>
            <div class="quest-card__progress">
              <div class="progress-bar">
                <div class="progress-bar__fill" style="width: ${percent}%"></div>
              </div>
              <span class="progress-text">${completed}/${total} steps</span>
            </div>
          </button>
        `;
        })
        .join("")}
    </div>
  `;

  content.innerHTML = html;

  // Add click listeners to quest cards
  content.querySelectorAll(".quest-card").forEach((card) => {
    card.addEventListener("click", () => {
      const questId = card.dataset.questId;
      renderQuestDetail(questId);
    });
  });
}

function renderQuestDetail(questId) {
  currentView = "detail";
  currentQuestId = questId;

  const quest = questData.find((q) => q.id === questId);
  if (!quest) return;

  const { completed, total } = getQuestProgress(quest);
  const percent = Math.round((completed / total) * 100);

  const html = `
    <div class="quest-detail">
      <button class="back-button">&larr; All Quests</button>
      <div class="quest-detail__header">
        <div class="quest-card__category">${quest.category === "major" ? "Major Quest" : "Side Quest"}</div>
        <h2 class="quest-detail__name">${quest.npc}</h2>
        <p class="quest-card__location">${quest.location}</p>
        <p class="quest-detail__desc">${quest.description}</p>
        <div class="quest-detail__progress">
          <div class="progress-bar progress-bar--large">
            <div class="progress-bar__fill" style="width: ${percent}%"></div>
          </div>
          <span class="progress-text">${completed}/${total} steps complete</span>
        </div>
      </div>
      <ol class="step-list">
        ${quest.steps
          .map(
            (step) => `
          <li class="step ${progress[step.id] ? "step--done" : ""}">
            <label class="step__label">
              <input
                type="checkbox"
                class="step__checkbox"
                data-step-id="${step.id}"
                ${progress[step.id] ? "checked" : ""}
              />
              <span class="step__check-icon"></span>
              <div class="step__content">
                <span class="step__title">${step.title}</span>
                <span class="step__desc">${step.description}</span>
              </div>
            </label>
          </li>
        `
          )
          .join("")}
      </ol>
    </div>
  `;

  content.innerHTML = html;

  // Back button
  content.querySelector(".back-button").addEventListener("click", () => {
    renderQuestList();
  });

  // Checkbox listeners
  content.querySelectorAll(".step__checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", (e) => {
      const stepId = e.target.dataset.stepId;
      progress[stepId] = e.target.checked;
      saveProgress(progress);
      // Re-render to update progress bar
      renderQuestDetail(questId);
    });
  });
}

// --- Start ---
fetch("./data/quests.json")
  .then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  })
  .then((data) => {
    questData = data;
    renderQuestList();
  })
  .catch((err) => {
    console.error("Failed to load quests:", err);
    document.getElementById("content").innerHTML = `<p style="color: red;">Error loading quests: ${err.message}</p>`;
  });
