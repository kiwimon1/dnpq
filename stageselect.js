// ===========================================================
// 스테이지 선택 화면
// ===========================================================

const STAGE_NODE_GAP = 220;       // 노드 사이 세로 간격
const STAGE_NODE_TOP_OFFSET = 120; // 첫 노드 위쪽 여백

let currentStageIndex = null; // 지금 도전 중인 스테이지 인덱스

// 엔딩 연출이 끝나면 이 함수가 호출되어 스테이지 화면을 연다.
function openStageSelect(){
    stageSelect.style.display = "flex";
    renderStageMap();
}

function renderStageMap(){
    // 스크롤 영역 전체 높이 계산 (스테이지가 늘어나면 자동으로 길어짐)
    const totalHeight = STAGE_NODE_TOP_OFFSET * 2 + (stageList.length - 1) * STAGE_NODE_GAP;
    stageMapContent.style.height = totalHeight + "px";

    // 기존 노드 제거 후 다시 그림
    stageMapContent.querySelectorAll(".stage-node").forEach(el => el.remove());

    const points = [];

    stageList.forEach((stage, index) => {
        const unlocked = isStageUnlocked(index);
        const cleared = isStageCleared(stage.id);

        const y = STAGE_NODE_TOP_OFFSET + index * STAGE_NODE_GAP;
        const xPercent = (index % 2 === 0) ? 32 : 68; // 지그재그 배치

        points.push({ x: xPercent, y: y });

        const nodeEl = document.createElement("div");
        nodeEl.className = "stage-node";
        if(!unlocked) nodeEl.classList.add("locked");
        if(cleared) nodeEl.classList.add("cleared");

        nodeEl.style.left = xPercent + "%";
        nodeEl.style.top = y + "px";

        nodeEl.innerHTML =
            '<span class="stage-node-label">' + stage.name + '</span>' +
            (cleared ? '<span class="stage-node-check">★</span>' : "") +
            (!unlocked ? '<span class="stage-node-lock">🔒</span>' : "");

        nodeEl.addEventListener("click", (e) => {
            e.stopPropagation();
            openStageInfo(stage, index);
        });

        stageMapContent.appendChild(nodeEl);
    });

    drawStagePath(points);
}

// 노드들의 중심을 곡선으로 이어주는 SVG 경로를 그린다.
function drawStagePath(points){
    const totalHeight = stageMapContent.offsetHeight;

    stageMapSvg.setAttribute("viewBox", "0 0 100 " + totalHeight);
    stageMapSvg.setAttribute("preserveAspectRatio", "none");

    let d = "";
    for(let i = 0; i < points.length - 1; i++){
        const p1 = points[i];
        const p2 = points[i + 1];
        const midY = (p1.y + p2.y) / 2;

        if(i === 0){
            d += "M " + p1.x + " " + p1.y + " ";
        }
        d += "C " + p1.x + " " + midY + ", " + p2.x + " " + midY + ", " + p2.x + " " + p2.y + " ";
    }

    stageMapSvg.innerHTML = '<path d="' + d + '" class="stage-path"></path>';
}

// 노드 클릭 시 오른쪽에 스테이지 정보(난이도/등장 적)와 시작 버튼을 띄운다.
function openStageInfo(stage, index){
    const unlocked = isStageUnlocked(index);

    if(!unlocked){
        stageInfoPanel.innerHTML =
            '<h3 class="info-title">' + stage.name + '</h3>' +
            '<p class="info-desc">아직 잠겨있는 스테이지다. 이전 스테이지를 먼저 클리어하자.</p>';
        stageInfoPanel.style.display = "block";
        return;
    }

    const enemyNames = stage.enemies.map(e => e.name).join(", ");

    stageInfoPanel.innerHTML =
        '<h3 class="info-title">' + stage.name + '</h3>' +
        '<p class="info-desc">난이도: ' + stage.difficulty + '</p>' +
        '<p class="info-desc">등장 적: ' + enemyNames + '</p>' +
        '<p class="info-desc">' + stage.desc + '</p>' +
        '<button class="panel-action-btn" id="stageStartBtn">시작</button>';

    stageInfoPanel.style.display = "block";

    document.getElementById("stageStartBtn").onclick = (e) => {
        e.stopPropagation();
        startStageBattle(stage, index);
    };
}

// 빈 공간을 누르면 정보 패널이 닫힌다.
stageMapScroll.addEventListener("click", () => {
    stageInfoPanel.style.display = "none";
});

function startStageBattle(stage, index){
    currentStageIndex = index;
    stageInfoPanel.style.display = "none";
    stageSelect.style.display = "none";
    gameStage.style.display = "flex";
    initBattle(stage); // battle.js
}

// 전투가 끝나면(승/패 상관없이) 이 함수로 스테이지 화면에 돌아온다.
function returnToStageSelect(){
    gameStage.style.display = "none";
    battleResultEl.style.display = "none";
    stageSelect.style.display = "flex";
    renderStageMap();
}

// 전투 승리 시 battle.js의 checkBattleEnd에서 호출된다.
function handleStageWin(){
    if(currentStageIndex !== null){
        markStageCleared(stageList[currentStageIndex].id);
    }
}

// 전투 패배 시 battle.js의 checkBattleEnd에서 호출된다. (진행도 변화 없음, 재도전 가능)
function handleStageLose(){
}
