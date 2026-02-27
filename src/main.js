// --- State ---

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Load saved progress from localStorage (or start fresh)
function loadProgress() {
  const saved = localStorage.getItem("quest-progress");
  if (!saved) return {};
  try {
    return JSON.parse(saved);
  } catch {
    return {};
  }
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
  const completed = quest.steps.filter((s) => progress[s.id] === true).length;
  return { completed, total: quest.steps.length };
}

function updateDashboard() {
  const visibleQuests = questData.filter((q) =>
    currentTab === "dlc" ? q.category === "dlc" : q.category !== "dlc"
  );
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

  const stats = content.querySelectorAll(".stat__value");
  if (stats.length >= 3) {
    stats[0].textContent = `${overallPercent}%`;
    stats[1].textContent = `${completedQuests}/${visibleQuests.length}`;
    stats[2].textContent = `${completedSteps}/${totalSteps}`;
  }
  const dashboardFill = content.querySelector(".dashboard .progress-bar__fill");
  if (dashboardFill) {
    dashboardFill.style.width = `${overallPercent}%`;
  }
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

  // Find first incomplete step (0 or undefined, but not 1 or 2)
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
        <div class="next-step__quest-name">${escapeHtml(nextStep.npcName)}</div>
        <div class="next-step__title">${escapeHtml(nextStep.title)}</div>
        <div class="next-step__description">${escapeHtml(nextStep.description)}</div>
        <div class="next-step__action">
          <label class="next-step__label-action">
            <input type="checkbox" class="next-step__checkbox" data-step-id="${escapeHtml(nextStep.id)}" ${progress[nextStep.id] ? "checked" : ""} />
            <span class="next-step__check-icon"></span>
            <span>Step complete</span>
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
          const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
          const isDone = completed === total && total > 0;

          return `
          <button class="quest-card ${isDone ? "quest-card--done" : ""}" data-quest-id="${escapeHtml(quest.id)}">
            <div class="quest-card__category">${quest.category === "major" ? "Major Quest" : quest.category === "dlc" ? "Shadow of the Erdtree" : "Side Quest"}</div>
            <h2 class="quest-card__name">${escapeHtml(quest.npc)}</h2>
            <p class="quest-card__location">${escapeHtml(quest.location)}</p>
            <p class="quest-card__desc">${escapeHtml(quest.description)}</p>
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

  const modalHtml = `
    <div class="modal-backdrop"></div>
    <div class="modal-container">
      <div class="quest-detail">
        <button class="back-button">&larr; Close</button>
        <div class="quest-detail__header">
          <div class="quest-card__category">${quest.category === "major" ? "Major Quest" : quest.category === "dlc" ? "Shadow of the Erdtree" : "Side Quest"}</div>
          <h2 class="quest-detail__name">${escapeHtml(quest.npc)}</h2>
          <p class="quest-card__location">${escapeHtml(quest.location)}</p>
          <p class="quest-detail__desc">${escapeHtml(quest.description)}</p>
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
                  data-step-id="${escapeHtml(step.id)}"
                  ${progress[step.id] ? "checked" : ""}
                />
                <span class="step__check-icon"></span>
                <div class="step__content">
                  <span class="step__title">${escapeHtml(step.title)}</span>
                  <span class="step__desc">${escapeHtml(step.description)}</span>
                  ${step.note ? `<span class="step__note">⚠ ${escapeHtml(step.note)}</span>` : ""}
                </div>
              </label>
            </li>
          `
            )
            .join("")}
        </ol>
      </div>
    </div>
  `;

  // Create modal container and inject
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", `${quest.npc} quest details`);
  modal.innerHTML = modalHtml;
  document.body.appendChild(modal);

  // Focus management
  const closeButton = modal.querySelector(".back-button");
  closeButton.focus();

  function closeModal() {
    document.removeEventListener("keydown", handleEscape);
    modal.remove();
    currentView = "list";
    currentQuestId = null;
    // Return focus to the quest card that opened the modal
    const originCard = content.querySelector(`[data-quest-id="${questId}"]`);
    if (originCard) originCard.focus();
  }

  function handleEscape(e) {
    if (e.key === "Escape") closeModal();
  }
  document.addEventListener("keydown", handleEscape);

  // Back button / Close modal
  closeButton.addEventListener("click", closeModal);

  // Backdrop close
  modal.querySelector(".modal-backdrop").addEventListener("click", closeModal);

  // Checkbox listeners - update progress and quest card in background
  modal.querySelectorAll(".step__checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", (e) => {
      const stepId = e.target.dataset.stepId;
      progress[stepId] = e.target.checked;
      saveProgress(progress);

      // Update step styling in modal
      const stepEl = modal.querySelector(`[data-step-id="${stepId}"]`).closest(".step");
      stepEl.classList.toggle("step--done");
      stepEl.classList.add("step--just-toggled");
      stepEl.addEventListener("animationend", () => stepEl.classList.remove("step--just-toggled"), { once: true });

      // Update modal progress bar
      const { completed, total } = getQuestProgress(quest);
      const percent = Math.round((completed / total) * 100);
      const progressFill = modal.querySelector(".progress-bar__fill");
      const progressText = modal.querySelector(".progress-text");
      progressFill.style.width = percent + "%";
      progressText.textContent = `${completed}/${total} steps complete`;

      // Update dashboard stats
      updateDashboard();

      // Update quest card in the list (if visible)
      const questCard = content.querySelector(`[data-quest-id="${questId}"]`);
      if (questCard) {
        const cardProgressFill = questCard.querySelector(".progress-bar__fill");
        const cardProgressText = questCard.querySelector(".progress-text");
        cardProgressFill.style.width = percent + "%";
        cardProgressText.textContent = `${completed}/${total} steps`;
      }

      // Update next-step section if on DLC tab
      if (currentTab === "dlc") {
        const nextStep = getNextIncompleteStep();
        const nextStepSection = content.querySelector(".next-step-section");
        if (nextStepSection) {
          if (nextStep) {
            nextStepSection.innerHTML = `
              <div class="next-step">
                <div class="next-step__label">NEXT STEP</div>
                <div class="next-step__quest-name">${escapeHtml(nextStep.npcName)}</div>
                <div class="next-step__title">${escapeHtml(nextStep.title)}</div>
                <div class="next-step__description">${escapeHtml(nextStep.description)}</div>
                <div class="next-step__action">
                  <label class="next-step__label-action">
                    <input type="checkbox" class="next-step__checkbox" data-step-id="${escapeHtml(nextStep.id)}" />
                    <span class="next-step__check-icon"></span>
                    <span>Step complete</span>
                  </label>
                </div>
              </div>
            `;
            // Re-attach event listener to updated checkbox
            const updatedCheckbox = nextStepSection.querySelector(".next-step__checkbox");
            updatedCheckbox.addEventListener("click", (e2) => {
              e2.preventDefault();
              const newStepId = e2.target.dataset.stepId;
              progress[newStepId] = !progress[newStepId];
              saveProgress(progress);
              renderQuestList();
            });
          } else {
            nextStepSection.innerHTML = `
              <div class="next-step next-step--complete">
                <div class="next-step__label">ALL STEPS COMPLETE!</div>
                <div class="next-step__title">You've completed the Shadow of the Erdtree questlines!</div>
              </div>
            `;
          }
        }
      }
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
    const errorEl = document.createElement("p");
    errorEl.style.color = "red";
    errorEl.textContent = `Error loading quests: ${err.message}`;
    const contentEl = document.getElementById("content");
    contentEl.innerHTML = "";
    contentEl.appendChild(errorEl);
  });
