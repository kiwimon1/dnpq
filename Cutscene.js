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
                // 지지직거리는 도중 "일어나" 화면을 뒤에서 끄고 스테이지 선택 화면을 켭니다.
                ending.style.display = "none";

                // 스테이지 선택 화면 열기 (stageSelect.js)
                openStageSelect();

                // ==========================================
                // [스테이지 선택 진입 지점] 
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

// ===========================
// Skip
// ===========================

skip.onclick = ()=>{
    showEnding();
}