// ===========================
// 공용 HTML 요소 참조
// 다른 스크립트 파일(options.js, cutscene.js, battle.js)에서
// 공통으로 사용하는 요소들을 여기 모아둔다.
// (index.html에서 이 파일을 가장 먼저 불러와야 한다)
// ===========================

const mainMenu = document.getElementById("mainMenu");
const startBtn = document.getElementById("startBtn");
const optionBtn = document.getElementById("optionBtn");

const optionsScreen = document.getElementById("optionsScreen");
const closeOptionsBtn = document.getElementById("closeOptionsBtn");
const volumeSlider = document.getElementById("volumeSlider");
const volumeValue = document.getElementById("volumeValue");

const cutscene = document.getElementById("cutscene");
const sceneImage = document.getElementById("sceneImage");
const dialogue = document.getElementById("dialogue");

const fade = document.getElementById("fade");

const skip = document.getElementById("skip");

const ending = document.getElementById("ending");
const endingText = document.getElementById("endingText");

// 전투 화면 요소
const gameStage = document.getElementById("gameStage");
const targetInfo = document.getElementById("targetInfo");
const allyPartyEl = document.getElementById("allyParty");
const enemyPartyEl = document.getElementById("enemyParty");
const turnIndicatorEl = document.getElementById("turnIndicator");
const battleResultEl = document.getElementById("battleResult");
const actionTooltipEl = document.getElementById("actionTooltip");