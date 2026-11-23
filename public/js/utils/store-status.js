export function isStoreOpen(store) {

  if (!store.is_open) return false;
  if (!store.opening_hours) return store.is_open;

  let hours;

  try {
    hours = typeof store.opening_hours === "string"
      ? JSON.parse(store.opening_hours)
      : store.opening_hours;
  } catch {
    return store.is_open;
  }

  if (hours.always_open) return true;

  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();

  const daysMap = ["sun","mon","tue","wed","thu","fri","sat"];

  const todayKey = daysMap[now.getDay()];
  const yesterdayKey = daysMap[(now.getDay() + 6) % 7];

  function checkRanges(dayData, checkPreviousDay = false) {

    if (!dayData || dayData.closed) return false;

    const ranges = Array.isArray(dayData)
      ? dayData
      : [dayData];

    for (const range of ranges) {

      if (!range.open || !range.close) continue;

      const [oh, om] = range.open.split(":").map(Number);
      const [ch, cm] = range.close.split(":").map(Number);

      const openTime = oh * 60 + om;
      const closeTime = ch * 60 + cm;

      // normal
      if (openTime <= closeTime) {

        if (
          !checkPreviousDay &&
          current >= openTime &&
          current <= closeTime
        ) {
          return true;
        }

      }

      // nocturno
      if (openTime > closeTime) {

        if (!checkPreviousDay && current >= openTime) {
          return true;
        }

        if (checkPreviousDay && current <= closeTime) {
          return true;
        }

      }

    }

    return false;
  }

  if (checkRanges(hours[todayKey], false)) return true;

  if (checkRanges(hours[yesterdayKey], true)) return true;

  return false;
}

export function getStoreStatusInfo(store) {

  let hours;

  try {
    hours = typeof store.opening_hours === "string"
      ? JSON.parse(store.opening_hours)
      : store.opening_hours;
  } catch {
    return {
      text:"Sin horarios",
      color:"#6b7280"
    };
  }

  if (!hours) {
    return {
      text:"Sin horarios",
      color:"#6b7280"
    };
  }

  if (hours.always_open) {
    return {
      text:"Abierto 24hs",
      color:"#16a34a"
    };
  }

  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();

  const daysMap = ["sun","mon","tue","wed","thu","fri","sat"];

  const todayKey = daysMap[now.getDay()];
  const today = hours[todayKey];

  if (!today || today.closed) {
    return {
      text:"Cerrado",
      color:"#9ca3af"
    };
  }

  const ranges = Array.isArray(today)
    ? today
    : [today];

  let isOpen = false;
  let nextClose = null;
  let nextOpen = null;

  for (const r of ranges) {

    if (!r.open || !r.close) continue;

    const [oh, om] = r.open.split(":").map(Number);
    const [ch, cm] = r.close.split(":").map(Number);

    const openTime = oh * 60 + om;
    const closeTime = ch * 60 + cm;

    // normal
    if (openTime <= closeTime) {

      if (
        current >= openTime &&
        current <= closeTime
      ) {
        isOpen = true;
        nextClose = r.close;
        break;
      }

    }

    // nocturno
    else {

      if (
        current >= openTime ||
        current <= closeTime
      ) {
        isOpen = true;
        nextClose = r.close;
        break;
      }

    }

    if (current < openTime && !nextOpen) {
      nextOpen = r.open;
    }

  }

  if (isOpen) {
    return {
      text:`Abierto ahora · Cierra ${nextClose}`,
      color:"#16a34a"
    };
  }

  if (nextOpen) {
    return {
      text:`Cerrado · Abre ${nextOpen}`,
      color:"#f59e0b"
    };
  }

  return {
    text:"Cerrado",
    color:"#9ca3af"
  };
}
