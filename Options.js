// ===========================
// 옵션 화면
// ===========================

// 음량 값 (0~100). 나중에 사운드를 추가하면 이 값을 Audio.volume(0~1)에
// 연결하기만 하면 된다. 예: bgm.volume = masterVolume / 100;
let masterVolume = 70;

optionBtn.onclick = () => {
    optionsScreen.style.display = "flex";
};

closeOptionsBtn.onclick = () => {
    optionsScreen.style.display = "none";
};

volumeSlider.oninput = () => {
    masterVolume = Number(volumeSlider.value);
    volumeValue.innerText = masterVolume;

    // 나중에 사운드가 생기면 여기서 실제 볼륨을 갱신하면 된다.
    // 예: if(bgm) bgm.volume = masterVolume / 100;
};