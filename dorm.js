const API = "https://inai-col1.fishrungames.com";

// Поле resident в ответе /students/{id}:
// resident === true  -> местный, resident === false -> иногородний.
// Если по заданию наоборот, поменяй на true.
const NONRESIDENT_VALUE = false;

const form = document.getElementById("form");
const btn = document.getElementById("btn");
const resultEl = document.getElementById("result");

// GET-запрос; 404 возвращает null (объект не найден), остальные ошибки бросают исключение
async function getJson(path) {
  const res = await fetch(API + path);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Сервер ответил " + res.status + " на " + path);
  return res.json();
}

function checkStudent(student) {
  if (!student) {
    return { ok: false, title: "Студент", text: "Студент с таким ID не найден" };
  }
  const nonResident = student.resident === NONRESIDENT_VALUE;
  return {
    ok: nonResident,
    title: "Студент",
    text: nonResident
      ? student.name + " — иногородний"
      : student.name + " не иногородний, право на общежитие не подтверждено",
  };
}

function checkBuilding(building) {
  if (!building) {
    return { ok: false, title: "Корпус", text: "Корпус с таким номером не найден" };
  }
  return {
    ok: building.forStudents === true,
    title: "Корпус",
    text: building.forStudents
      ? "Корпус " + building.building_number + " предназначен для студентов"
      : "Корпус " + building.building_number + " не предназначен для студентов",
  };
}

function checkRoom(room) {
  if (!room) {
    return { ok: false, title: "Комната", text: "Комната с таким номером не найдена" };
  }
  return {
    ok: room.available === true,
    title: "Комната",
    text: room.available
      ? "Комната " + room.room_number + " свободна"
      : "Комната " + room.room_number + " занята",
  };
}

function render(checks) {
  resultEl.replaceChildren();

  const allOk = checks.every((c) => c.ok);
  const verdict = document.createElement("div");
  verdict.className = "verdict " + (allOk ? "ok" : "bad");
  verdict.textContent = allOk
    ? "Всё окей: заселение возможно"
    : "Отказ: условия не выполнены";
  resultEl.appendChild(verdict);

  const ul = document.createElement("ul");
  for (const c of checks) {
    const li = document.createElement("li");
    li.className = c.ok ? "ok" : "bad";

    const mark = document.createElement("span");
    mark.className = "mark";
    mark.textContent = c.ok ? "✓" : "✗";

    const body = document.createElement("div");
    body.textContent = c.title;
    const small = document.createElement("small");
    small.textContent = c.text;
    body.appendChild(small);

    li.append(mark, body);
    ul.appendChild(li);
  }
  resultEl.appendChild(ul);
}

function showError(message) {
  resultEl.replaceChildren();
  const div = document.createElement("div");
  div.className = "verdict bad";
  div.textContent = "Ошибка: " + message;
  resultEl.appendChild(div);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const studentId = form.elements["student"].value.trim();
  const buildingNo = form.elements["building"].value.trim();
  const roomNo = form.elements["room"].value.trim();

  btn.disabled = true;
  resultEl.textContent = "Проверяем…";
  try {
    // три независимых GET-запроса выполняем параллельно
    const [student, building, room] = await Promise.all([
      getJson("/students/" + encodeURIComponent(studentId)),
      getJson("/buildings/" + encodeURIComponent(buildingNo)),
      getJson("/rooms/" + encodeURIComponent(roomNo)),
    ]);
    render([checkStudent(student), checkBuilding(building), checkRoom(room)]);
  } catch (err) {
    showError(err.message);
  } finally {
    btn.disabled = false;
  }
});
