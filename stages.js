// ===========================================================
// 스테이지 데이터 + 저장/진행도 관리
// ===========================================================
// 스테이지가 늘어나면 이 배열에 객체만 추가하면 스테이지맵에 자동으로 이어진다.
// enemies는 battle.js의 enemyTeam 형식과 동일하게 적으면 된다.

const stageList = [
    {
        id: "1-1",
        name: "1-1",
        difficulty: "쉬움",
        desc: "숲 초입에서 만나는 훈련용 상대다.",
        enemies: [
            { id: "bot", name: "훈련 봇", hp: 1000, maxHp: 1000, img: "images/trainingbot.png", desc: "연습을 위한 훈련 봇이다.", atk: 40, stunned: false }
        ]
    },
    {
        id: "1-2",
        name: "1-2",
        difficulty: "보통",
        desc: "숲 깊숙한 곳에서 정찰 중인 오크다.",
        enemies: [
            { id: "scout", name: "오크 정찰병", hp: 800, maxHp: 800, img: "images/orc_scout.png", desc: "빠르게 움직이는 정찰병이다.", atk: 60, stunned: false }
        ]
    },
    {
        id: "1-3",
        name: "1-3",
        difficulty: "어려움",
        desc: "무리를 지어 다니는 오크 전사다.",
        enemies: [
            { id: "warrior", name: "오크 전사", hp: 1200, maxHp: 1200, img: "images/orc_warrior.png", desc: "거친 힘을 가진 전사다.", atk: 90, stunned: false }
        ]
    }
    // 나중에 스테이지가 늘어나면 여기에 객체만 추가하면 된다.
];

// 브라우저(=플레이하는 사람)마다 따로 저장되는 localStorage 키
const SAVE_KEY = "cat_adventure_save_v1";

let stageProgress = {}; // 예: { "1-1": { cleared: true }, "1-2": { cleared: true } }

// 페이지를 열 때 저장된 진행도를 불러온다.
function loadProgress(){
    try{
        const raw = localStorage.getItem(SAVE_KEY);
        stageProgress = raw ? JSON.parse(raw) : {};
    }catch(e){
        stageProgress = {};
    }
}

// 현재 진행도를 브라우저에 저장한다. (자동저장/수동저장 공용)
function saveProgress(){
    try{
        localStorage.setItem(SAVE_KEY, JSON.stringify(stageProgress));
        return true;
    }catch(e){
        console.warn("저장 실패:", e);
        return false;
    }
}

function isStageCleared(id){
    return !!(stageProgress[id] && stageProgress[id].cleared);
}

// 첫 스테이지는 항상 열려있고, 그 다음부터는 바로 앞 스테이지를 깨야 열린다.
function isStageUnlocked(index){
    if(index === 0) return true;
    return isStageCleared(stageList[index - 1].id);
}

function markStageCleared(id){
    stageProgress[id] = { cleared: true };
    saveProgress(); // 스테이지 클리어 시 자동저장
}

loadProgress();
