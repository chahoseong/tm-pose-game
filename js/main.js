/**
 * main.js
 * 포즈 인식과 게임 로직 연결
 */

// 전역 변수
let poseEngine;
let gameEngine;
let stabilizer;
let ctx;
let labelContainer;

/**
 * 애플리케이션 초기화
 */
async function init() {
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");

  startBtn.disabled = true;

  try {
    // 1. PoseEngine 초기화
    poseEngine = new PoseEngine("./my_model/");
    const { maxPredictions, webcam } = await poseEngine.init({
      size: 200,
      flip: true
    });

    // 2. Stabilizer 초기화
    stabilizer = new PredictionStabilizer({
      threshold: 0.7,
      smoothingFrames: 3
    });

    // 3. GameEngine 초기화
    gameEngine = new GameEngine();

    // 4. 캔버스 설정
    const canvas = document.getElementById("canvas");
    canvas.width = 200;
    canvas.height = 200;
    ctx = canvas.getContext("2d");

    // 5. Label Container 설정
    labelContainer = document.getElementById("label-container");
    labelContainer.innerHTML = ""; // 초기화
    for (let i = 0; i < maxPredictions; i++) {
      labelContainer.appendChild(document.createElement("div"));
    }

    // 6. PoseEngine 콜백 설정
    poseEngine.setPredictionCallback(handlePrediction);
    poseEngine.setDrawCallback(drawGame); // 게임 그리기 콜백으로 변경

    // 7. PoseEngine 시작
    poseEngine.start();

    // 8. 게임 바로 시작 (선택사항, 버튼으로 시작하게 할 수도 있음)
    gameEngine.start();

    stopBtn.disabled = false;
  } catch (error) {
    console.error("초기화 중 오류 발생:", error);
    alert("초기화에 실패했습니다. 콘솔을 확인하세요.");
    startBtn.disabled = false;
  }
}

/**
 * 애플리케이션 중지
 */
function stop() {
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");

  if (poseEngine) {
    poseEngine.stop();
  }

  if (gameEngine) {
    gameEngine.stop();
  }

  startBtn.disabled = false;
  stopBtn.disabled = true;
}

/**
 * 예측 결과 처리 콜백
 */
function handlePrediction(predictions, pose) {
  // 1. Stabilizer로 예측 안정화
  const stabilized = stabilizer.stabilize(predictions);

  // 2. Label Container 업데이트
  for (let i = 0; i < predictions.length; i++) {
    const classPrediction =
      predictions[i].className + ": " + predictions[i].probability.toFixed(2);
    labelContainer.childNodes[i].innerHTML = classPrediction;
  }

  // 3. 최고 확률 예측 표시
  const maxPredictionDiv = document.getElementById("max-prediction");
  maxPredictionDiv.innerHTML = stabilized.className || "감지 중...";

  // 4. GameEngine에 플레이어 포즈 전달
  if (stabilized.className) {
    gameEngine.setPlayerAction(stabilized.className);
  }
}

/**
 * 게임 및 포즈 그리기 콜백
 * PoseEngine의 drawLoop에서 호출됨
 */
function drawGame(pose) {
  // 1. 웹캠 배경 그리기 (선택사항: 게임 몰입감을 위해 끄거나 흐리게 할 수 있음)
  if (poseEngine.webcam && poseEngine.webcam.canvas) {
    ctx.globalAlpha = 0.5; // 반투명하게 그려서 게임 아이템이 잘 보이도록
    ctx.drawImage(poseEngine.webcam.canvas, 0, 0);
    ctx.globalAlpha = 1.0;
  }

  // 2. GameEngine 그리기 (아이템, 플레이어, 점수)
  if (gameEngine) {
    gameEngine.draw(ctx);
  }
}
