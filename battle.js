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

    // 스테이지 배경 적용
    if(stage.background){
        gameStage.style.backgroundImage = `url("${stage.background}")`;
        
        // 1920x1080 해상도 전체에 딱 맞춰 늘리거나 채우는 설정
        gameStage.style.backgroundSize = "100% 100%"; // 또는 "cover"
        gameStage.style.backgroundPosition = "center";
        gameStage.style.backgroundRepeat = "no-repeat";
        
        // 픽셀이 선명하게 보이도록 스크립트에서도 스타일 재확인
        gameStage.style.imageRendering = "pixelated";
    }

    createHeroTeam();
    // ... 이하 기존 코드

    createHeroTeam();
    // ... 이하 기존 코드 동일

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
// 아군 행동 처리 (3연속 궁극기 적용)
// ===========================

function handleAllyAction(action){
    if(battleLocked) return;

    const hero = allyTeam[turnIndex];
    if(!hero) return;

    const canUse = (action.energyCost <= hero.energy) && (action.ultCost <= hero.ult);
    if(!canUse) return;

    battleLocked = true;
    hideActionTooltip();

    const attackerEl = allyPartyEl.querySelector('.slot[data-index="' + turnIndex + '"]');

    // 💡 1회 타격 시(타당 100 데미지) 적 전체에게 데미지 숫자 띄우기
    const triggerHitDamage = (dmgValue) => {
        enemyTeam.forEach((target, idx) => {
            if (target.hp > 0) {
                applyDamageToTarget("enemy", idx, dmgValue);
            }
        });
    };

    // 일반 단일/스킬 타격 및 턴 종료 정리
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

    // 💡 행동 분기
    if (action.ultCost >= 50) { 
        // 1. 궁극기: ult_sword_boom.png 로 0.5초 간격 3연타 (타당 100 데미지)
        playTripleUltimateSlash("images/ult_sword_boom.png", () => {
            // [수정] 1타당 100 데미지를 화면 리렌더링 없이 안전하게 적용
            const targetIndex = enemyTeam.findIndex(c => c.hp > 0);
            if (targetIndex !== -1) {
                const target = enemyTeam[targetIndex];
                target.hp = Math.max(0, target.hp - 100); // 데이터상으로만 HP 감소
                
                // 해당 적 슬롯에 번쩍임 + 데미지 팝업 이펙트 노출
                const slotEl = enemyPartyEl.querySelector('.slot[data-index="' + targetIndex + '"]');
                if (slotEl) {
                    playHitEffect(slotEl, 100);
                }
            }
        }, () => {
            processHit(true); // 3연타 완료 후 턴을 넘기며 전체 UI 리렌더링(renderAll) 실행
        });
    } else if (action.key === "basic") {
        // 2. 기본 공격: 참격
        const targetIndex = enemyTeam.findIndex(c => c.hp > 0);
        const targetEl = enemyPartyEl.querySelector('.slot[data-index="' + targetIndex + '"]');
        launchProjectile(attackerEl, targetEl, "images/sword_boom.png", () => processHit(false), false);
    } else {
        // 3. 일반 스킬: 나무검 회전
        const targetIndex = enemyTeam.findIndex(c => c.hp > 0);
        const targetEl = enemyPartyEl.querySelector('.slot[data-index="' + targetIndex + '"]');
        launchProjectile(attackerEl, targetEl, "images/wood_sword.png", () => processHit(false), true);
    }
}

// 💡 적군 개별 타겟에게 데미지를 입히는 보조 함수
// 💡 [수정 완료] 적군 개별 타겟에게 데미지를 입히는 보조 함수
function applyDamageToTarget(side, index, dmg) {
    const target = enemyTeam[index];
    if (!target) return;

    // 데미지 적용
    target.hp = Math.max(0, target.hp - dmg);
    
    // UI 전체 리렌더링 (체력바 최신화)
    renderAll();

    // 해당 슬롯 위치에 기존에 잘 작동하던 번쩍임 + 데미지 팝업 이펙트 함수 호출
    const slotEl = enemyPartyEl.querySelector('.slot[data-index="' + index + '"]');
    if (slotEl) {
        playHitEffect(slotEl, dmg);
    }
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

    // 기절 상태 처리
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

    // 현재 살아있는 아군(주인공)의 실제 슬롯 가져오기
    const targetIndex = allyTeam.findIndex(c => c.hp > 0);
    const targetEl = targetIndex !== -1 ? allyPartyEl.querySelector('.slot[data-index="' + targetIndex + '"]') : null;

    setTimeout(() => {
        // 1. 💡 boom.png 피격 연출을 시작함과 동시에
        playTargetEffect(targetEl, "images/boom.png", () => {
            // 이 콜백은 이펙트가 다 사라진(0.45초 뒤) 시점에 실행됩니다.
            closeCharPanel();

            if(checkBattleEnd()) return;

            battleLocked = false;
            advanceTurn();
        });

        // 2. 💡 피격 이펙트 재생과 '동시에' 데미지 수치를 화면에 띄웁니다!
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
// ===========================
// [수정] 투사체 발사 함수 (기본 공격은 건드리지 않고, flipX, flipY 옵션 추가)
// ===========================
// ===========================
// 투사체 발사 함수 (기본 공격 정상, 필요할 때만 좌우 뒤집기)
// ===========================
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

    if (isSpinning) {
        proj.classList.add("spinning-projectile");
        proj.style.setProperty("--base-angle", `${angle}deg`);
    } else {
        // 기본 공격은 그대로 회전만, 궁극기는 isFlipped가 true이므로 이미지를 뒤집음 (scaleX(-1))
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
// ===========================
// 적군 전용: 타깃(주인공) 위치에 피격 이펙트 재생 함수
// ===========================
function playTargetEffect(targetEl, imageSrc, onHitCallback) {
    if (!targetEl) {
        if (onHitCallback) onHitCallback();
        return;
    }

    const stageRect = gameStage.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    // 160px 크기의 절반인 80px을 빼서 중앙 좌표 계산
    const targetX = (targetRect.left + targetRect.width / 2) - stageRect.left - 80;
    const targetY = (targetRect.top + targetRect.height / 2) - stageRect.top - 80;

    // boom 피격 DOM 생성
    const effect = document.createElement("div");
    effect.className = "hit-effect";
    effect.style.backgroundImage = `url("${imageSrc}")`;
    effect.style.left = `${targetX}px`;
    effect.style.top = `${targetY}px`;

    gameStage.appendChild(effect);

    // 0.45초 애니메이션이 끝나면 DOM을 깔끔하게 제거하고 피해 적용
    setTimeout(() => {
        effect.remove();
        if (onHitCallback) onHitCallback();
    }, 450);
}
// ===========================
// 적군 전용: 타깃(주인공) 위치에 피격 이펙트 재생 함수
// ===========================
function playTargetEffect(targetEl, imageSrc, onHitCallback) {
    if (!targetEl) {
        if (onHitCallback) onHitCallback();
        return;
    }

    const stageRect = gameStage.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    // 160px 크기의 절반인 80px을 빼서 타깃 중앙 좌표 계산 (gameStage 기준 상대좌표)
    const targetX = (targetRect.left + targetRect.width / 2) - stageRect.left - 80;
    const targetY = (targetRect.top + targetRect.height / 2) - stageRect.top - 80;

    // boom 피격 DOM 생성
    const effect = document.createElement("div");
    effect.className = "hit-effect";
    effect.style.backgroundImage = `url("${imageSrc}")`;
    effect.style.left = `${targetX}px`;
    effect.style.top = `${targetY}px`;

    // gameStage 내부에 직접 추가
    gameStage.appendChild(effect);

    // 0.45초 유지 후 제거 및 피격 처리
    setTimeout(() => {
        effect.remove();
        if (onHitCallback) onHitCallback();
    }, 450);
}

// ===========================
// [최종] 궁극기 연출: 1타 명중 후 0.5초 대기 -> 2타 명중 후 0.5초 대기 -> 3타 순차 발사
// ===========================
function playTripleUltimateSlash(imageSrc, onHitEach, onComplete) {
    let hitCount = 0;

    const executeSlash = () => {
        const attackerEl = allyPartyEl.querySelector(`.slot[data-index="${turnIndex}"]`);
        const targetIndex = enemyTeam.findIndex(c => c.hp > 0);
        const targetEl = targetIndex !== -1 ? enemyPartyEl.querySelector(`.slot[data-index="${targetIndex}"]`) : null;

        if (!attackerEl || !targetEl) {
            if (onComplete) onComplete();
            return;
        }

        // 3번의 참격 모두 방향 뒤집기 (isFlipped = true)
        const isFlipped = true;

        // 투사체 발사
        launchProjectile(attackerEl, targetEl, imageSrc, () => {
            // 참격이 적에게 도착해서 명중한 순간 데미지 적용
            if (onHitEach) onHitEach();
            
            hitCount++;

            if (hitCount < 3) {
                // 💡 [핵심 수정] 타격이 끝난 후 정확히 0.5초(500ms)를 대기한 뒤 다음 참격 발사
                setTimeout(executeSlash, 500);
            } else {
                // 3타가 모두 명중하고 연출이 끝났으므로 약간 대기 후 턴 종료
                setTimeout(() => {
                    if (onComplete) onComplete();
                }, 500);
            }
        }, false, isFlipped); 
    };

    // 첫 번째 참격 발사 시작
    executeSlash();
}