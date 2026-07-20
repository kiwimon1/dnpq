// ===========================================================
// 전투 시스템 
// ===========================================================
// 캐릭터가 늘어나도 배열에 추가만 하면 되도록 데이터로 관리한다.
// img 경로에 실제 이미지가 없으면 onerror로 숨겨지고, 슬롯 자체의
// player-active / enemy-active 배경색(CSS)이 그대로 보여 대체된다.

let allyTeam = [];
let enemyTeam = [];
let turnSide = "ally";   // "ally" | "enemy"
let turnIndex = 0;       // 현재 행동 순번 (팀 배열 인덱스)
let battleLocked = false; // 연출 중 중복 입력 방지

function createHeroTeam(){
    allyTeam = [
        {
            id: "hero",
            name: "주인공",
            hp: 500,
            maxHp: 500,
            img: "images/hero.png",
            desc: "우리의 주인공이다.",
            energy: 0,       // 0~5칸, 아군 턴이 한 바퀴 돌 때마다 1칸씩 충전
            maxEnergy: 5,
            ult: 0,          // 0~100%, 공격할 때마다 20%씩 충전
            maxUlt: 100,
            stunned: false,
            actions: [
                { key: "basic", label: "기본 공격", desc: "베기 - 100의 피해를 입힌다.", dmg: 100, energyCost: 0, ultCost: 0, ultGain: 20, stun: false },
                { key: "skill", label: "스킬", desc: "칼 던지기 - 300의 피해를 입히고 대상을 기절시킨다. (게이지 1칸 소모)", dmg: 300, energyCost: 1, ultCost: 0, ultGain: 20, stun: true },
                { key: "ult", label: "궁극기", desc: "찌르기 - 500의 강력한 피해를 입힌다. (궁극기 게이지 100% 필요)", dmg: 500, energyCost: 0, ultCost: 100, ultGain: 0, stun: false }
            ]
        }
    ];
}

// 스테이지 데이터의 적 목록을 얕은 복사해서 사용한다.
function buildEnemyTeam(enemyDefs){
    return enemyDefs.map(e => Object.assign({}, e));
}

function initBattle(stage){
    // 스테이지 배경 적용
    if(stage.background){
        gameStage.style.backgroundImage = `url("${stage.background}")`;
        gameStage.style.backgroundSize = "100% 100%";
        gameStage.style.backgroundPosition = "center";
        gameStage.style.backgroundRepeat = "no-repeat";
        gameStage.style.imageRendering = "pixelated";
    }

    createHeroTeam();
    enemyTeam = buildEnemyTeam(stage.enemies);
    turnSide = "ally";
    turnIndex = 0;
    battleLocked = false;
    battleResultEl.style.display = "none";
    closeCharPanel();
    renderAll();
}

function renderAll(){
    renderTeam(allyTeam, allyPartyEl, "ally");
    renderTeam(enemyTeam, enemyPartyEl, "enemy");
    updateTurnIndicator();
    renderHeroHud();
}

// 항상 보이는 주인공 게이지 미니 HUD (에너지 5칸 + 궁극기 %)
function renderHeroHud(){
    const hud = document.getElementById("heroHud");
    if(!hud) return;

    const hero = allyTeam[0];
    if(!hero || hero.hp <= 0){
        hud.style.display = "none";
        return;
    }

    hud.style.display = "flex";

    let cellsHtml = "";
    for(let i=0; i<hero.maxEnergy; i++){
        cellsHtml += '<div class="hud-energy-cell' + (i < hero.energy ? " filled" : "") + '"></div>';
    }

    hud.innerHTML =
        '<div class="hud-title">' + hero.name + ' 게이지</div>' +
        '<div class="hud-energy">' + cellsHtml + '</div>' +
        '<div class="hud-ult">궁극기 ' + hero.ult + '%</div>';
}

function renderTeam(team, containerEl, side){
    containerEl.innerHTML = "";

    const visualOrder = (side === "ally") ? [3, 2, 1, 0] : [0, 1, 2, 3];

    visualOrder.forEach(i => {
        const slotEl = document.createElement("div");
        slotEl.className = "slot";

        const char = team[i];

        if(char && char.hp > 0){
            slotEl.classList.add(side === "ally" ? "player-active" : "enemy-active");
            slotEl.dataset.side = side;
            slotEl.dataset.index = i;

            const tagClass = side === "enemy" ? "character-tag red-tag" : "character-tag";
            const stunSuffix = char.stunned ? " (기절)" : "";

            slotEl.innerHTML =
                '<img src="' + char.img + '" class="char-img" alt="' + char.name + '" onerror="this.style.display=\'none\'">' +
                '<span class="' + tagClass + '">' + char.name + stunSuffix + '</span>';

            slotEl.addEventListener("click", (e) => {
                e.stopPropagation();
                openCharPanel(char, side, i, slotEl);
            });
        }

        containerEl.appendChild(slotEl);
    });

    highlightActiveTurn();
}

function highlightActiveTurn(){
    document.querySelectorAll(".slot.active-turn").forEach(el => el.classList.remove("active-turn"));

    const containerEl = turnSide === "ally" ? allyPartyEl : enemyPartyEl;
    const activeSlot = containerEl.querySelector('.slot[data-index="' + turnIndex + '"]');
    if(activeSlot) activeSlot.classList.add("active-turn");
}

function updateTurnIndicator(){
    turnIndicatorEl.innerText = (turnSide === "ally") ? "아군의 턴" : "적의 턴";
}

// ===========================
// 캐릭터 클릭 → 정보/액션 패널
// ===========================

function openCharPanel(char, side, index, slotEl){
    const isAllysTurnNow = (side === "ally" && turnSide === "ally" && turnIndex === index && !battleLocked);

    let html =
        '<h3 class="info-title">' + char.name + '</h3>' +
        '<div class="info-hp-wrapper">' +
            '<div class="info-hp-bar" style="width:' + Math.max(0, (char.hp / char.maxHp) * 100) + '%"></div>' +
            '<span class="info-hp-text">HP: ' + char.hp + ' / ' + char.maxHp + '</span>' +
        '</div>' +
        '<p class="info-desc">' + char.desc + '</p>';

    if(char.stunned){
        html += '<p class="info-desc" style="color:#ff7675;">기절 상태라 이번 턴에는 행동할 수 없다.</p>';
    }

    if(isAllysTurnNow){
        html += '<div class="panel-actions">';
        char.actions.forEach(a => {
            const canUse = (a.energyCost <= char.energy) && (a.ultCost <= char.ult);
            const disabledAttr = canUse ? "" : "disabled";
            html += '<button class="panel-action-btn" data-key="' + a.key + '" ' + disabledAttr + '>' +
                        a.label +
                    '</button>';
        });
        html += '</div>';
    }

    targetInfo.innerHTML = html;
    targetInfo.classList.toggle("ally-panel", side === "ally");
    targetInfo.style.display = "block";

    if(isAllysTurnNow){
        targetInfo.querySelectorAll(".panel-action-btn").forEach(btn => {
            const action = char.actions.find(a => a.key === btn.dataset.key);

            btn.addEventListener("mouseenter", () => showActionTooltip(action, btn));
            btn.addEventListener("mouseleave", hideActionTooltip);

            btn.onclick = (e) => {
                e.stopPropagation();
                handleAllyAction(action);
            };
        });
    }
}

function showActionTooltip(action, btnEl){
    let text = action.label + ": " + action.desc;

    if(action.energyCost > 0) text += " (게이지 " + action.energyCost + "칸 필요)";
    if(action.ultCost > 0) text += " (궁극기 게이지 100% 필요)";

    actionTooltipEl.innerText = text;
    actionTooltipEl.style.display = "block";

    const rect = btnEl.getBoundingClientRect();
    const tooltipWidth = 260;

    actionTooltipEl.style.top = rect.top + "px";
    actionTooltipEl.style.left = (rect.left - tooltipWidth - 15) + "px";
}

function hideActionTooltip(){
    actionTooltipEl.style.display = "none";
}

function closeCharPanel(){
    targetInfo.style.display = "none";
    targetInfo.innerHTML = "";
    hideActionTooltip();
}

gameStage.onclick = () => {
    closeCharPanel();
};

// ===========================================================
// 아군 행동 처리
// ===========================================================

function handleAllyAction(action){
    if(battleLocked) return;

    const hero = allyTeam[turnIndex];
    if(!hero) return;

    const canUse = (action.energyCost <= hero.energy) && (action.ultCost <= hero.ult);
    if(!canUse) return;

    battleLocked = true;
    hideActionTooltip();

    const attackerEl = allyPartyEl.querySelector('.slot[data-index="' + turnIndex + '"]');

    const processHit = (isMultiTarget = false) => {
        if(action.energyCost > 0) hero.energy = Math.max(0, hero.energy - action.energyCost);
        if(action.ultCost > 0) hero.ult = Math.max(0, hero.ult - action.ultCost);
        if(action.ultGain > 0) hero.ult = Math.min(hero.maxUlt, hero.ult + action.ultGain);

        if (!isMultiTarget) {
            applyDamage("ally", action.dmg);
        }

        closeCharPanel();
        if(checkBattleEnd()) return;

        setTimeout(() => {
            battleLocked = false;
            advanceTurn();
        }, 500);
    };

    // 💡 궁극기 분기점
    if (action.ultCost >= 50) { 
        if(action.energyCost > 0) hero.energy = Math.max(0, hero.energy - action.energyCost);
        if(action.ultCost > 0) hero.ult = Math.max(0, hero.ult - action.ultCost);
        if(action.ultGain > 0) hero.ult = Math.min(hero.maxUlt, hero.ult + action.ultGain);

        const targetIndex = enemyTeam.findIndex(c => c.hp > 0);
        const targetEl = targetIndex !== -1 ? enemyPartyEl.querySelector(`.slot[data-index="${targetIndex}"]`) : null;

        // 🚀 3연속 참격 실행 함수 호출
        playTripleUltimateSlash("images/ult_sword_boom.png", (fixedTargetIdx) => {
            const target = enemyTeam[fixedTargetIdx];
            if (target && target.hp > 0) {
                target.hp = Math.max(0, target.hp - 100); // 타당 100 데미지 감산
                
                renderHeroHud(); 
                if (targetInfo.style.display === "block") {
                    const hpBar = targetInfo.querySelector('.info-hp-bar');
                    const hpText = targetInfo.querySelector('.info-hp-text');
                    if(hpBar) hpBar.style.width = Math.max(0, (target.hp / target.maxHp) * 100) + '%';
                    if(hpText) hpText.innerText = 'HP: ' + target.hp + ' / ' + target.maxHp;
                }

                if (targetEl) {
                    playHitEffect(targetEl, 100);
                }
            }
        }, () => {
            renderAll();
            closeCharPanel();
            if (checkBattleEnd()) return;
            
            setTimeout(() => {
                battleLocked = false;
                advanceTurn();
            }, 500);
        });

    } else if (action.key === "basic") {
        const targetIndex = enemyTeam.findIndex(c => c.hp > 0);
        const targetEl = enemyPartyEl.querySelector('.slot[data-index="' + targetIndex + '"]');
        launchProjectile(attackerEl, targetEl, "images/sword_boom.png", () => processHit(false), false);
    } else {
        const targetIndex = enemyTeam.findIndex(c => c.hp > 0);
        const targetEl = enemyPartyEl.querySelector('.slot[data-index="' + targetIndex + '"]');
        launchProjectile(attackerEl, targetEl, "images/wood_sword.png", () => processHit(false), true);
    }
}

function applyDamageToTarget(side, index, dmg) {
    const target = enemyTeam[index];
    if (!target) return;

    target.hp = Math.max(0, target.hp - dmg);
    renderAll();

    const slotEl = enemyPartyEl.querySelector('.slot[data-index="' + index + '"]');
    if (slotEl) {
        playHitEffect(slotEl, dmg);
    }
}

function applyDamage(attackerSide, dmg){
    const targetTeam = (attackerSide === "ally") ? enemyTeam : allyTeam;
    const targetIndex = targetTeam.findIndex(c => c.hp > 0);
    if(targetIndex === -1) return null;

    const target = targetTeam[targetIndex];
    target.hp = Math.max(0, target.hp - dmg);

    renderAll();

    const targetSide = (attackerSide === "ally") ? "enemy" : "ally";
    const containerEl = (targetSide === "ally") ? allyPartyEl : enemyPartyEl;
    const slotEl = containerEl.querySelector('.slot[data-index="' + targetIndex + '"]');
    if(slotEl){
        playHitEffect(slotEl, dmg);
    }

    return target;
}

function playHitEffect(slotEl, dmg){
    if(slotEl.classList.contains("player-active") || slotEl.classList.contains("enemy-active")){
        slotEl.classList.add("hit-flash");
        setTimeout(() => slotEl.classList.remove("hit-flash"), 350);
    }

    const rect = slotEl.getBoundingClientRect();

    const dmgEl = document.createElement("div");
    dmgEl.className = "damage-popup";
    dmgEl.innerText = "-" + dmg;
    dmgEl.style.left = (rect.left + rect.width / 2) + "px";
    dmgEl.style.top = (rect.top + rect.height / 2) + "px";

    document.body.appendChild(dmgEl);
    setTimeout(() => dmgEl.remove(), 900);
}

// ===========================
// 턴 진행
// ===========================

function advanceTurn(){
    const team = (turnSide === "ally") ? allyTeam : enemyTeam;

    let next = turnIndex + 1;
    while(next < team.length && !(team[next] && team[next].hp > 0)) next++;

    if(next < team.length){
        turnIndex = next;
    } else {
        turnSide = (turnSide === "ally") ? "enemy" : "ally";
        turnIndex = 0;
        const newTeam = (turnSide === "ally") ? allyTeam : enemyTeam;
        while(turnIndex < newTeam.length && !(newTeam[turnIndex] && newTeam[turnIndex].hp > 0)) turnIndex++;

        if(turnSide === "ally"){
            allyTeam.forEach(c => {
                if(c.hp > 0 && typeof c.energy === "number"){
                    c.energy = Math.min(c.maxEnergy, c.energy + 1);
                }
            });
        }
    }

    renderAll();

    if(turnSide === "enemy"){
        setTimeout(enemyAutoAttack, 800);
    }
}

function enemyAutoAttack(){
    const attacker = enemyTeam[turnIndex];
    if(!attacker || attacker.hp <= 0){
        advanceTurn();
        return;
    }

    battleLocked = true;
    const slotEl = enemyPartyEl.querySelector('.slot[data-index="' + turnIndex + '"]');

    if(attacker.stunned){
        if(slotEl) openCharPanel(attacker, "enemy", turnIndex, slotEl);

        setTimeout(() => {
            attacker.stunned = false;
            closeCharPanel();
            battleLocked = false;
            advanceTurn();
        }, 900);
        return;
    }

    if(slotEl) openCharPanel(attacker, "enemy", turnIndex, slotEl);

    const targetIndex = allyTeam.findIndex(c => c.hp > 0);
    const targetEl = targetIndex !== -1 ? allyPartyEl.querySelector('.slot[data-index="' + targetIndex + '"]') : null;

    setTimeout(() => {
        playTargetEffect(targetEl, "images/boom.png", () => {
            closeCharPanel();
            if(checkBattleEnd()) return;
            battleLocked = false;
            advanceTurn();
        });

        applyDamage("enemy", attacker.atk || 30);
    }, 500);
}

function checkBattleEnd(){
    const enemyDown = enemyTeam.every(c => c.hp <= 0);
    const allyDown = allyTeam.every(c => c.hp <= 0);

    if(enemyDown || allyDown){
        battleLocked = true;
        closeCharPanel();

        if(enemyDown){
            handleStageWin();
        } else {
            handleStageLose();
        }

        battleResultEl.innerHTML =
            '<div>' + (enemyDown ? "승리!" : "패배...") + '</div>' +
            '<button id="backToMapBtn" class="panel-action-btn">스테이지 목록으로</button>';
        battleResultEl.style.display = "flex";

        document.getElementById("backToMapBtn").onclick = () => {
            returnToStageSelect();
        };

        return true;
    }
    return false;
}

// ===========================================================
// 투사체 발사 함수 (isFlipped 옵션 적용)
// ===========================================================
function launchProjectile(attackerEl, targetEl, imageSrc, onHitCallback, isSpinning = false, isFlipped = false) {
    if (!attackerEl || !targetEl) {
        if (onHitCallback) onHitCallback();
        return;
    }

    const stageRect = gameStage.getBoundingClientRect();
    const attackerRect = attackerEl.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    const startX = (attackerRect.left + attackerRect.width / 2) - stageRect.left - 80;
    const startY = (attackerRect.top + attackerRect.height / 2) - stageRect.top - 80;

    const targetX = (targetRect.left + targetRect.width / 2) - stageRect.left - 80;
    const targetY = (targetRect.top + targetRect.height / 2) - stageRect.top - 80;

    const deltaX = targetX - startX;
    const deltaY = targetY - startY;
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    const proj = document.createElement("div");
    proj.className = "projectile";
    proj.style.backgroundImage = `url("${imageSrc}")`;
    proj.style.left = `${startX}px`;
    proj.style.top = `${startY}px`;
    proj.style.transition = "left 0.45s ease-in-out, top 0.45s ease-in-out"; // ✅ 추가

    if (isSpinning) {
        proj.classList.add("spinning-projectile");
        proj.style.setProperty("--base-angle", `${angle}deg`);
    } else {
        proj.style.transform = `rotate(${angle}deg) ${isFlipped ? 'scaleX(-1)' : ''}`;
    }

    gameStage.appendChild(proj);

    requestAnimationFrame(() => {
        proj.style.left = `${targetX}px`;
        proj.style.top = `${targetY}px`;
    });

    setTimeout(() => {
        proj.remove();
        if (onHitCallback) onHitCallback();
    }, 450);
}

// ===========================================================
// 적군 전용 피격 이펙트 재생 함수 (중복 제거 완료)
// ===========================================================
function playTargetEffect(targetEl, imageSrc, onHitCallback) {
    if (!targetEl) {
        if (onHitCallback) onHitCallback();
        return;
    }

    const stageRect = gameStage.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    const targetX = (targetRect.left + targetRect.width / 2) - stageRect.left - 80;
    const targetY = (targetRect.top + targetRect.height / 2) - stageRect.top - 80;

    const effect = document.createElement("div");
    effect.className = "hit-effect";
    effect.style.backgroundImage = `url("${imageSrc}")`;
    effect.style.left = `${targetX}px`;
    effect.style.top = `${targetY}px`;

    gameStage.appendChild(effect);

    setTimeout(() => {
        effect.remove();
        if (onHitCallback) onHitCallback();
    }, 450);
}

// ===========================================================
// 투사체 발사 함수 (Reflow 강제 트리거로 위치 스왑/잔상 버그 완벽 수정)
// ===========================================================
function launchProjectile(attackerEl, targetEl, imageSrc, onHitCallback, isSpinning = false, isFlipped = false) {
    if (!attackerEl || !targetEl) {
        if (onHitCallback) onHitCallback();
        return;
    }

    const stageRect = gameStage.getBoundingClientRect();
    const attackerRect = attackerEl.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    // 시작 및 타겟 중앙 좌표 계산
    const startX = (attackerRect.left + attackerRect.width / 2) - stageRect.left - 80;
    const startY = (attackerRect.top + attackerRect.height / 2) - stageRect.top - 80;

    const targetX = (targetRect.left + targetRect.width / 2) - stageRect.left - 80;
    const targetY = (targetRect.top + targetRect.height / 2) - stageRect.top - 80;

    const deltaX = targetX - startX;
    const deltaY = targetY - startY;
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    // 1. 완전히 독립된 새로운 투사체 DOM 엘리먼트 생성
    const proj = document.createElement("div");
    proj.className = "projectile";
    proj.style.backgroundImage = `url("${imageSrc}")`;
    proj.style.left = `${startX}px`;
    proj.style.top = `${startY}px`;

    if (isSpinning) {
        proj.classList.add("spinning-projectile");
        proj.style.setProperty("--base-angle", `${angle}deg`);
    } else {
        proj.style.transform = `rotate(${angle}deg) ${isFlipped ? 'scaleX(-1)' : ''}`;
    }

    gameStage.appendChild(proj);

    // 💡 [핵심 버그 수정]: 브라우저에게 이 투사체의 시작 위치를 즉시 인지하도록 강제 갱신(Reflow)시킵니다.
    // 이 코드가 빠지면 연속 발사 시 2, 3번째 참격의 애니메이션 시작 좌표가 꼬여서 스왑 현상이 생깁니다.
    proj.offsetWidth; 

    // 2. 렌더링 타임라인 분리하여 목적지로 이동 애니메이션 시작
    requestAnimationFrame(() => {
        proj.style.left = `${targetX}px`;
        proj.style.top = `${targetY}px`;
    });

    setTimeout(() => {
        proj.remove();
        if (onHitCallback) onHitCallback();
    }, 450);
}

// ===========================================================
// 적군 전용 피격 이펙트 재생 함수
// ===========================================================
function playTargetEffect(targetEl, imageSrc, onHitCallback) {
    if (!targetEl) {
        if (onHitCallback) onHitCallback();
        return;
    }

    const stageRect = gameStage.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    const targetX = (targetRect.left + targetRect.width / 2) - stageRect.left - 80;
    const targetY = (targetRect.top + targetRect.height / 2) - stageRect.top - 80;

    const effect = document.createElement("div");
    effect.className = "hit-effect";
    effect.style.backgroundImage = `url("${imageSrc}")`;
    effect.style.left = `${targetX}px`;
    effect.style.top = `${targetY}px`;

    gameStage.appendChild(effect);

    setTimeout(() => {
        effect.remove();
        if (onHitCallback) onHitCallback();
    }, 450);
}

// ===========================================================
// 투사체 발사 함수 (Reflow 강제 트리거로 위치 스왑/잔상 버그 완벽 수정)
// ===========================================================
function launchProjectile(attackerEl, targetEl, imageSrc, onHitCallback, isSpinning = false, isFlipped = false) {
    if (!attackerEl || !targetEl) {
        if (onHitCallback) onHitCallback();
        return;
    }

    const stageRect = gameStage.getBoundingClientRect();
    const attackerRect = attackerEl.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    // 시작 및 타겟 중앙 좌표 계산
    const startX = (attackerRect.left + attackerRect.width / 2) - stageRect.left - 80;
    const startY = (attackerRect.top + attackerRect.height / 2) - stageRect.top - 80;

    const targetX = (targetRect.left + targetRect.width / 2) - stageRect.left - 80;
    const targetY = (targetRect.top + targetRect.height / 2) - stageRect.top - 80;

    const deltaX = targetX - startX;
    const deltaY = targetY - startY;
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    // 1. 완전히 독립된 새로운 투사체 DOM 엘리먼트 생성
    const proj = document.createElement("div");
    proj.className = "projectile";
    proj.style.backgroundImage = `url("${imageSrc}")`;
    proj.style.left = `${startX}px`;
    proj.style.top = `${startY}px`;

    if (isSpinning) {
        proj.classList.add("spinning-projectile");
        proj.style.setProperty("--base-angle", `${angle}deg`);
    } else {
        proj.style.transform = `rotate(${angle}deg) ${isFlipped ? 'scaleX(-1)' : ''}`;
    }

    gameStage.appendChild(proj);

    // 💡 [핵심 버그 수정]: 브라우저에게 이 투사체의 시작 위치를 즉시 인지하도록 강제 갱신(Reflow)시킵니다.
    // 이 코드가 빠지면 연속 발사 시 2, 3번째 참격의 애니메이션 시작 좌표가 꼬여서 스왑 현상이 생깁니다.
    proj.offsetWidth; 

    // 2. 렌더링 타임라인 분리하여 목적지로 이동 애니메이션 시작
    requestAnimationFrame(() => {
        proj.style.left = `${targetX}px`;
        proj.style.top = `${targetY}px`;
    });

    setTimeout(() => {
        proj.remove();
        if (onHitCallback) onHitCallback();
    }, 450);
}

// ===========================================================
// 적군 전용 피격 이펙트 재생 함수
// ===========================================================
function playTargetEffect(targetEl, imageSrc, onHitCallback) {
    if (!targetEl) {
        if (onHitCallback) onHitCallback();
        return;
    }

    const stageRect = gameStage.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    const targetX = (targetRect.left + targetRect.width / 2) - stageRect.left - 80;
    const targetY = (targetRect.top + targetRect.height / 2) - stageRect.top - 80;

    const effect = document.createElement("div");
    effect.className = "hit-effect";
    effect.style.backgroundImage = `url("${imageSrc}")`;
    effect.style.left = `${targetX}px`;
    effect.style.top = `${targetY}px`;

    gameStage.appendChild(effect);

    setTimeout(() => {
        effect.remove();
        if (onHitCallback) onHitCallback();
    }, 450);
}

// ===========================================================
// 3연속 거대 참격 개별 분리 및 타임라인 동기화 함수
// ===========================================================
function playTripleUltimateSlash(imageSrc, onHitEach, onComplete) {
    const fixedTargetIndex = enemyTeam.findIndex(c => c.hp > 0);
    const attackerEl = allyPartyEl.querySelector(`.slot[data-index="${turnIndex}"]`);
    const targetEl = fixedTargetIndex !== -1 ? enemyPartyEl.querySelector(`.slot[data-index="${fixedTargetIndex}"]`) : null;

    if (!attackerEl || !targetEl) {
        if (onComplete) onComplete();
        return;
    }

    const isFlipped = true;

    // ------------------------------------------------------
    // 🔥 [1번째 참격] 즉시 출발 (0.0초)
    // ------------------------------------------------------
    launchProjectile(attackerEl, targetEl, imageSrc, () => {
        if (onHitEach) onHitEach(fixedTargetIndex);
    }, false, isFlipped);

    // ------------------------------------------------------
    // 🔥 [2번째 참격] 정확히 0.5초(500ms) 뒤 완벽히 분리되어 출발
    // ------------------------------------------------------
    setTimeout(() => {
        const currentAttacker = allyPartyEl.querySelector(`.slot[data-index="${turnIndex}"]`);
        const currentTarget = enemyPartyEl.querySelector(`.slot[data-index="${fixedTargetIndex}"]`);
        
        if (currentAttacker && currentTarget) {
            launchProjectile(currentAttacker, currentTarget, imageSrc, () => {
                if (onHitEach) onHitEach(fixedTargetIndex);
            }, false, isFlipped);
        }
    }, 500);

    // ------------------------------------------------------
    // 🔥 [3번째 참격] 정확히 1.0초(1000ms) 뒤 완벽히 분리되어 출발
    // ------------------------------------------------------
    setTimeout(() => {
        const currentAttacker = allyPartyEl.querySelector(`.slot[data-index="${turnIndex}"]`);
        const currentTarget = enemyPartyEl.querySelector(`.slot[data-index="${fixedTargetIndex}"]`);
        
        if (currentAttacker && currentTarget) {
            launchProjectile(currentAttacker, currentTarget, imageSrc, () => {
                if (onHitEach) onHitEach(fixedTargetIndex);
                
                // 3타 적중 연출 마무리 후 여운을 주고 종료
                setTimeout(() => {
                    if (onComplete) onComplete();
                }, 500);
            }, false, isFlipped);
        } else {
            if (onComplete) onComplete();
        }
    }, 1000);
}
