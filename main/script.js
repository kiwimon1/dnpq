// ===========================
// 컷신 데이터
// ===========================

const cutscenes = [
    {
        image: "images/cut1.png",
        text: "어느 평화로웠던 마을..."
    },
    {
        image: "images/cut2.png",
        text: "갑자기 오크들이 마을을 습격했다."
    },
    {
        image: "images/cut3.png",
        text: "와장창!!"
    },
    {
        image: "images/cut4.png",
        text: "쨍그랑!!"
    },
    {
        image: "images/cut5.png",
        text: "그때 영웅들이 나타났다..."
    },
    {
        image: "images/cut6.png",
        text: "그게 바로 우리다."
    }
];

// ===========================
// HTML 요소
// ===========================

const mainMenu = document.getElementById("mainMenu");
const startBtn = document.getElementById("startBtn");
const optionBtn = document.getElementById("optionBtn");

const cutscene = document.getElementById("cutscene");
const sceneImage = document.getElementById("sceneImage");
const dialogue = document.getElementById("dialogue");

const fade = document.getElementById("fade");

const skip = document.getElementById("skip");

const ending = document.getElementById("ending");
const endingText = document.getElementById("endingText");

// 튜토리얼용 게임 스테이지 요소
const gameStage = document.getElementById("gameStage");
const targetInfo = document.getElementById("targetInfo");
const allyPartyEl = document.getElementById("allyParty");
const enemyPartyEl = document.getElementById("enemyParty");
const turnIndicatorEl = document.getElementById("turnIndicator");
const battleResultEl = document.getElementById("battleResult");
const actionTooltipEl = document.getElementById("actionTooltip");

// ===========================

let currentScene = 0;
let skipped = false;

// 타이머 변수 관리
let cutsceneTimer = null;
let fadeTimer = null;
let nextSceneTimer = null;

// ===========================
// 모든 예약된 타이머 클리어 함수
// ===========================
function clearAllCutsceneTimers() {
    if (cutsceneTimer) clearTimeout(cutsceneTimer);
    if (fadeTimer) clearTimeout(fadeTimer);
    if (nextSceneTimer) clearTimeout(nextSceneTimer);
}

// ===========================
// 컷신 출력
// ===========================

function showScene(index){
    sceneImage.src = cutscenes[index].image;
    dialogue.innerText = cutscenes[index].text;
}

// ===========================
// 마지막 장면 (일어나 ➔ 1초 대기 ➔ 노이즈 1회 ➔ 밝아짐과 함께 튜토리얼 맵 세팅)
// ===========================

function showEnding(){
    if (skipped) return; 
    skipped = true;

    // 대기 중이던 모든 타이머 제거
    clearAllCutsceneTimers();

    // 1. 노이즈 없이 부드럽게 화면을 먼저 어둡게 만듭니다.
    fade.classList.remove("glitch");
    fade.style.opacity = "1";

    setTimeout(()=>{

        // 2. 어둠 속에서 컷신 화면을 끄고 "일어나" 대사 화면을 노출합니다.
        cutscene.style.display = "none";
        ending.style.display = "flex";
        endingText.innerText = "일어나";

        // 3. 화면의 어둠을 걷어내어 "일어나" 글자가 선명히 보이게 합니다.
        fade.style.opacity = "0";

        // 4. 글자가 뜨고 딱 1초 동안 유저가 글자를 보며 대기합니다.
        setTimeout(()=>{
            
            // 5. [노이즈 1회 발생] 1초 대기 후 화면이 지지직거리기 시작합니다.
            fade.classList.add("glitch");

            setTimeout(()=>{
                // 지지직거리는 도중 "일어나" 화면을 뒤에서 끄고 튜토리얼 전장 스테이지를 활성화합니다.
                ending.style.display = "none";
                gameStage.style.display = "flex"; // 튜토리얼 UI 화면 켜기

                // 전투 데이터/화면 초기화
                initBattle();

                // ==========================================
                // [튜토리얼 시작 지점] 
                // ==========================================
                // 6. 지지직거리던 노이즈를 끄고 정상적으로 화면을 다시 밝힙니다.
                fade.classList.remove("glitch");
                fade.style.opacity = "0";

            }, 700); // 노이즈 지속 시간 (0.7초)

        }, 1000); // 일어나 출력 후 노이즈 발생까지 대기 시간 (1초)

    }, 700); // 첫 화면이 완전히 어두워질 때까지 걸리는 시간 (0.7초)
}

// ===========================
// 컷신 재생 (일반 페이드 효과 사용)
// ===========================

function playCutscene(){

    if(skipped) return;

    showScene(currentScene);

    // 컷신 2초 대기
    cutsceneTimer = setTimeout(()=>{

        if(skipped) return;

        // 마지막 컷신이 끝났을 경우 부드럽게 어두워진 뒤 엔딩(일어나 연출)으로 보냅니다.
        if(currentScene >= cutscenes.length - 1){
            showEnding();
            return;
        }

        // 일반 컷신들 사이에는 자연스럽게 어두워지는 페이드 처리
        fade.style.opacity = "1";

        // 완전히 어두워진 뒤 처리
        fadeTimer = setTimeout(()=>{

            if(skipped) return;

            currentScene++;

            // 검은 화면 상태에서 다음 컷신 변경
            showScene(currentScene);

            // 다시 서서히 밝아짐
            fade.style.opacity = "0";

            // 밝아진 후 다음 컷신 대기 타이머
            nextSceneTimer = setTimeout(()=>{
                playCutscene();
            }, 700);

        }, 700);

    }, 2000);
}

// ===========================
// 시작 버튼 (자연스럽게 어두워졌다 밝아지는 페이드)
// ===========================

startBtn.onclick = ()=>{
    fade.style.opacity = "1";

    setTimeout(() => {
        mainMenu.style.display = "none";
        cutscene.style.display = "block";

        currentScene = 0;
        skipped = false;

        clearAllCutsceneTimers();
        
        showScene(currentScene);

        fade.style.opacity = "0";

        setTimeout(() => {
            playCutscene();
        }, 700);

    }, 700);
}

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

function createInitialTeams(){
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

    enemyTeam = [
        {
            id: "bot",
            name: "훈련 봇",
            hp: 1000,
            maxHp: 1000,
            img: "images/trainingbot.png",
            desc: "연습을 위한 훈련 봇이다.",
            atk: 40,
            stunned: false
        }
        // 적이 늘어나면 여기에 객체만 추가하면 된다.
    ];
}

function initBattle(){
    createInitialTeams();
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
function renderTeam(team, containerEl, side){
    containerEl.innerHTML = "";

    for(let i=0; i<4; i++){
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
    }

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
        const target = applyDamage("ally", action.dmg);

        // 게이지 소모
        if(action.energyCost > 0){
            hero.energy = Math.max(0, hero.energy - action.energyCost);
        }
        if(action.ultCost > 0){
            hero.ult = Math.max(0, hero.ult - action.ultCost);
        }
        // 게이지 충전 (공격할 때마다)
        if(action.ultGain > 0){
            hero.ult = Math.min(hero.maxUlt, hero.ult + action.ultGain);
        }
        // 기절 부여
        if(action.stun && target){
            target.stunned = true;
        }

        renderAll();
        closeCharPanel();

        if(checkBattleEnd()) return;

        setTimeout(() => {
            battleLocked = false;
            advanceTurn();
        }, 350);
    }, 400);
}

// 공격 측 반대 팀에서 맨 앞(살아있는) 대상을 찾아 데미지를 적용하고, 그 대상을 반환한다.
function applyDamage(attackerSide, dmg){
    const targetTeam = (attackerSide === "ally") ? enemyTeam : allyTeam;
    const target = targetTeam.find(c => c.hp > 0);
    if(!target) return null;

    target.hp = Math.max(0, target.hp - dmg);
    renderAll();
    return target;
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
        battleResultEl.innerText = enemyDown ? "승리!" : "패배...";
        battleResultEl.style.display = "flex";
        return true;
    }
    return false;
}

// ===========================
// Skip
// ===========================

skip.onclick = ()=>{
    showEnding();
}

// ===========================
// ESC
// ===========================

document.addEventListener("keydown",(e)=>{
    if(e.key==="Escape"){
        showEnding();
    }
});