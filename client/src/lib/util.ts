function formatDate(date: Date) {
  function padTo2Digits(num: number) {
    return num.toString().padStart(2, "0");
  }
  const calendarDate = [
    padTo2Digits(date.getDate()),
    padTo2Digits(date.getMonth() + 1),
    date.getFullYear(),
  ].join("/");

  const hour = [
    padTo2Digits(date.getHours()),
    padTo2Digits(date.getMinutes()),
  ].join(":");

  return `${calendarDate}, ${hour}`;
}

function hexToRgb(hex: string) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error("The hex value provided is invalid");
  }
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export { formatDate, hexToRgb, sleep };
