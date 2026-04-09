export const checkValidationFile = (file: File) => {
  if (typeof file === "undefined") {
    alert("파일이 없습니다!");
    return false;
  }
  if (file.size > 5 * 1024 * 1024) {
    alert("파일 용량이 너무 큽니다. (제한: 5MB)");
    return false;
  }
  if (!file.type.includes("jpeg") && !file.type.includes("png")) {
    alert("jpeg 또는 png파일만 가능합니다");
    return false;
  }

  // 위에 있는 상황을 모두 통과하면 true !
  return true;
};

// 여기서 그냥 return만 해주면 onChangeFile함수를 멈추는게 아니라 checkValidationFile만 멈추게 됨
// 그래서 true false값을 리턴해줘서 그 값에 따라 onChangeFile를 멈추게 해줄거다
