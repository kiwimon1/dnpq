// ===========================
// 게임 시작 제어 (컷신 제외 버전)
// ===========================

startBtn.onclick = () => {
    // 화면을 부드럽게 어둡게 만듭니다.
    fade.style.opacity = "1";

    setTimeout(() => {
        // 메인 메뉴를 끄고 바로 스테이지 선택 화면을 켭니다.
        mainMenu.style.display = "none";
        
        // 스테이지 선택 화면 열기 (stageselect.js)
        openStageSelect();

        // 화면을 다시 밝게 만듭니다.
        fade.style.opacity = "0";

    }, 700); // 페이드 시간 (0.7초)
};