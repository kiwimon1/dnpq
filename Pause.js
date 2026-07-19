// ===========================================================
// 일시정지 / 저장 화면
// ===========================================================

function openPauseScreen(){
    pauseToast.style.display = "none";
    pauseScreen.style.display = "flex";
}

function closePauseScreen(){
    pauseScreen.style.display = "none";
}

pauseSaveBtn.onclick = () => {
    const ok = saveProgress(); // stages.js
    pauseToast.innerText = ok ? "저장되었습니다." : "저장에 실패했습니다.";
    pauseToast.style.display = "block";
};

pauseCloseBtn.onclick = () => {
    closePauseScreen();
};

// ESC 키: 컷신 재생 중이면 스킵, 그 외(스테이지 화면/전투 중)에는 일시정지(저장) 화면을 연다.
// 메인 메뉴/옵션 화면에서는 아무 동작도 하지 않는다.
document.addEventListener("keydown", (e) => {
    if(e.key !== "Escape") return;

    if(cutscene.style.display === "block"){
        showEnding(); // cutscene.js
        return;
    }

    if(mainMenu.style.display !== "none" || optionsScreen.style.display === "flex"){
        return;
    }

    if(pauseScreen.style.display === "flex"){
        closePauseScreen();
    } else {
        openPauseScreen();
    }
});