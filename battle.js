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
        // 나중에 아군이 늘어나면 여기에 객체만 추가하면 된다.
    ];
}

// 스테이지 데이터의 적 목록을 얕은 복사해서 사용한다.
// (그대로 참조하면 전투 중 깎인 HP가 stages.js의 원본 데이터에도 남아버림)
function buildEnemyTeam(enemyDefs){
    return enemyDefs.map(e => Object.assign({}, e));
}

function initBattle(stage){
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

// 4자리 슬롯을 그리되, 캐릭터가 없거나 죽은 자리는 빈 점선 슬롯으로 남긴다.
// 아군은 오른쪽(적과 가까운 쪽)부터, 적은 왼쪽(아군과 가까운 쪽)부터 채워져서
// 서로 마주보는 대형이 되도록 시각적 순서만 반전시킨다. (턴 진행에 쓰이는
// data-index는 실제 배열 인덱스를 그대로 유지하므로 다른 로직은 안 건드려도 됨)
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

// 현재 턴인 캐릭터의 슬롯에 강조 표시를 준다.
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

// 액션 버튼에 마우스를 올리면 왼쪽에 설명 툴팁을 띄운다.
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

// 전장 빈 공간을 누르면 패널이 닫힌다.
gameStage.onclick = () => {
    closeCharPanel();
};

// ===========================
// 아군 행동 처리
// ===========================

function handleAllyAction(action){
    if(battleLocked) return;

    const hero = allyTeam[turnIndex];
    if(!hero) return;

    const canUse = (action.energyCost <= hero.energy) && (action.ultCost <= hero.ult);
    if(!canUse) return;

    battleLocked = true;
    hideActionTooltip();

    setTimeout(() => {
        // 게이지 소모/충전은 데미지 적용(=렌더링) 전에 먼저 반영해서 한 번에 그려지게 한다.
        if(action.energyCost > 0){
            hero.energy = Math.max(0, hero.energy - action.energyCost);
        }
        if(action.ultCost > 0){
            hero.ult = Math.max(0, hero.ult - action.ultCost);
        }
        if(action.ultGain > 0){
            hero.ult = Math.min(hero.maxUlt, hero.ult + action.ultGain);
        }

        const target = applyDamage("ally", action.dmg);

        // 기절 부여 (태그 표시는 다음 렌더링 때 자연스럽게 반영됨)
        if(action.stun && target){
            target.stunned = true;
        }

        closeCharPanel();

        if(checkBattleEnd()) return;

        setTimeout(() => {
            battleLocked = false;
            advanceTurn();
        }, 500);
    }, 400);
}

// 공격 측 반대 팀에서 맨 앞(살아있는) 대상을 찾아 데미지를 적용하고, 그 대상을 반환한다.
function applyDamage(attackerSide, dmg){
    const targetTeam = (attackerSide === "ally") ? enemyTeam : allyTeam;
    const targetIndex = targetTeam.findIndex(c => c.hp > 0);
    if(targetIndex === -1) return null;

    const target = targetTeam[targetIndex];
    target.hp = Math.max(0, target.hp - dmg);

    renderAll();

    // 맞은 대상의 슬롯에 임팩트 이펙트 + 데미지 숫자를 띄운다.
    const targetSide = (attackerSide === "ally") ? "enemy" : "ally";
    const containerEl = (targetSide === "ally") ? allyPartyEl : enemyPartyEl;
    const slotEl = containerEl.querySelector('.slot[data-index="' + targetIndex + '"]');
    if(slotEl){
        playHitEffect(slotEl, dmg);
    }

    return target;
}

// 맞은 슬롯에 번쩍임/흔들림 효과와 위로 떠오르는 데미지 숫자를 보여준다.
function playHitEffect(slotEl, dmg){
    // 슬롯이 여전히 캐릭터를 담고 있을 때만(=이번 공격으로 죽지 않았을 때만) 번쩍임 적용
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
        // 현재 팀 행동이 모두 끝났으면 반대 팀으로 턴 전환
        turnSide = (turnSide === "ally") ? "enemy" : "ally";
        turnIndex = 0;
        const newTeam = (turnSide === "ally") ? allyTeam : enemyTeam;
        while(turnIndex < newTeam.length && !(newTeam[turnIndex] && newTeam[turnIndex].hp > 0)) turnIndex++;

        // 한 바퀴(적 턴 끝)를 돌아 다시 아군 턴이 되면 에너지 게이지가 1칸씩 찬다.
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

// 적 턴: 별도 입력 없이 자동으로 아군 맨 앞을 공격한다. 기절 상태면 공격을 건너뛴다.
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

    setTimeout(() => {
        applyDamage("enemy", attacker.atk || 30);
        closeCharPanel();

        if(checkBattleEnd()) return;

        battleLocked = false;
        advanceTurn();
    }, 900);
}

// ===========================
// 승패 체크
// ===========================

function checkBattleEnd(){
    const enemyDown = enemyTeam.every(c => c.hp <= 0);
    const allyDown = allyTeam.every(c => c.hp <= 0);

    if(enemyDown || allyDown){
        battleLocked = true;
        closeCharPanel();

        if(enemyDown){
            handleStageWin();  // stageSelect.js
        } else {
            handleStageLose(); // stageSelect.js
        }

        battleResultEl.innerHTML =
            '<div>' + (enemyDown ? "승리!" : "패배...") + '</div>' +
            '<button id="backToMapBtn" class="panel-action-btn">스테이지 목록으로</button>';
        battleResultEl.style.display = "flex";

        document.getElementById("backToMapBtn").onclick = () => {
            returnToStageSelect(); // stageSelect.js
        };

        return true;
    }
    return false;
}