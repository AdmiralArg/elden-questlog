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
let currentTab = "base"; // "base" or "dlc"

// --- Rendering ---

const content = document.getElementById("content");

function getQuestProgress(quest) {
  const completed = quest.steps.filter((s) => progress[s.id]).length;
  return { completed, total: quest.steps.length };
}

function getNextIncompleteStep() {
  // Filter to DLC quests only
  const dlcQuests = questData.filter((q) => q.category === "dlc");

  // Flatten all steps with their quest context
  const allDlcSteps = [];
  dlcQuests.forEach((quest) => {
    quest.steps.forEach((step) => {
      allDlcSteps.push({
        ...step,
        questId: quest.id,
        npcName: quest.npc,
      });
    });
  });

  // Sort by sequenceOrder (or Infinity if no order)
  allDlcSteps.sort((a, b) => (a.sequenceOrder || Infinity) - (b.sequenceOrder || Infinity));

  // Find first incomplete step
  return allDlcSteps.find((step) => !progress[step.id]) || null;
}

function renderQuestList() {
  currentView = "list";
  currentQuestId = null;

  const visibleQuests = questData.filter((q) =>
    currentTab === "dlc" ? q.category === "dlc" : q.category !== "dlc"
  );

  // Calculate stats for the active tab only
  const totalSteps = visibleQuests.reduce((sum, q) => sum + q.steps.length, 0);
  const completedSteps = visibleQuests.reduce(
    (sum, q) => sum + q.steps.filter((s) => progress[s.id]).length,
    0
  );
  const completedQuests = visibleQuests.filter((q) => {
    const { completed, total } = getQuestProgress(q);
    return completed === total && total > 0;
  }).length;
  const overallPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  // Get next step for DLC tab
  const nextStep = currentTab === "dlc" ? getNextIncompleteStep() : null;
  const nextStepHtml =
    currentTab === "dlc"
      ? nextStep
        ? `
    <div class="next-step-section">
      <div class="next-step">
        <div class="next-step__label">NEXT STEP</div>
        <div class="next-step__quest-name">${nextStep.npcName}</div>
        <div class="next-step__title">${nextStep.title}</div>
        <div class="next-step__description">${nextStep.description}</div>
        <div class="next-step__action">
          <label>
            <input type="checkbox" class="next-step__checkbox" data-step-id="${nextStep.id}" />
            <span>Mark Complete</span>
          </label>
        </div>
      </div>
    </div>
  `
        : `
    <div class="next-step-section">
      <div class="next-step next-step--complete">
        <div class="next-step__label">ALL STEPS COMPLETE!</div>
        <div class="next-step__title">You've completed the Shadow of the Erdtree questlines!</div>
      </div>
    </div>
  `
      : "";

  const html = `
    <div class="tabs">
      <button class="tab ${currentTab === "base" ? "tab--active" : ""}" data-tab="base">Base Game</button>
      <button class="tab ${currentTab === "dlc" ? "tab--active" : ""}" data-tab="dlc">Shadow of the Erdtree</button>
    </div>
    <div class="dashboard">
      <div class="dashboard__stats">
        <div class="stat">
          <span class="stat__value">${overallPercent}%</span>
          <span class="stat__label">Overall</span>
        </div>
        <div class="stat">
          <span class="stat__value">${completedQuests}/${visibleQuests.length}</span>
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
    ${nextStepHtml}
    <div class="quest-grid">
      ${visibleQuests
        .map((quest) => {
          const { completed, total } = getQuestProgress(quest);
          const percent = Math.round((completed / total) * 100);
          const isDone = completed === total;

          return `
          <button class="quest-card ${isDone ? "quest-card--done" : ""}" data-quest-id="${quest.id}">
            <div class="quest-card__category">${quest.category === "major" ? "Major Quest" : quest.category === "dlc" ? "Shadow of the Erdtree" : "Side Quest"}</div>
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

  // Tab click listeners
  content.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      currentTab = tab.dataset.tab;
      renderQuestList();
    });
  });

  // Quest card click listeners
  content.querySelectorAll(".quest-card").forEach((card) => {
    card.addEventListener("click", () => {
      const questId = card.dataset.questId;
      renderQuestDetail(questId);
    });
  });

  // Next step checkbox listener (DLC tab only)
  const nextStepCheckbox = content.querySelector(".next-step__checkbox");
  if (nextStepCheckbox) {
    nextStepCheckbox.addEventListener("change", (e) => {
      const stepId = e.target.dataset.stepId;
      progress[stepId] = e.target.checked;
      saveProgress(progress);
      renderQuestList(); // Re-render to show next step
    });
  }
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
        <div class="quest-card__category">${quest.category === "major" ? "Major Quest" : quest.category === "dlc" ? "Shadow of the Erdtree" : "Side Quest"}</div>
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
                ${step.note ? `<span class="step__note">⚠ ${step.note}</span>` : ""}
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
