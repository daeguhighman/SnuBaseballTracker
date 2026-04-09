import React from "react";
import {
  TeamListContainer,
  Title,
  TableWrapper,
  TeamListTable,
  BackButton,
} from "./playerList.style";

interface StudentData {
  department: string; // 학과
  name: string; // 성명
  status?: string; // 선출/WC 등
}

export default function PlayerListPageComponent() {
  // 예시 데이터
  const studentList: StudentData[] = [
    { department: "수학교육과", name: "윤동현" },
    { department: "언론정보학과", name: "김준기" },
    { department: "사회학과", name: "김태균", status: "선출" },
    { department: "컴퓨터공학과", name: "박야구" },
    { department: "컴퓨터공학과", name: "박야구", status: "선출/WC" },
    { department: "컴퓨터공학과", name: "박야구" },
    { department: "컴퓨터공학과", name: "박야구" },
    { department: "컴퓨터공학과", name: "박야구" },
  ];

  // 뒤로가기 버튼 클릭 시
  const handleBack = () => {
    alert("뒤로가기");
  };

  return (
    <TeamListContainer>
      <Title>관악사 야구부</Title>

      <TableWrapper>
        <TeamListTable>
          <thead>
            <tr>
              <th>학과</th>
              <th>성명</th>
              <th>선출/WC</th>
            </tr>
          </thead>
          <tbody>
            {studentList.map((student, index) => (
              <tr key={index}>
                <td>{student.department}</td>
                <td>{student.name}</td>
                <td>{student.status || ""}</td>
              </tr>
            ))}
          </tbody>
        </TeamListTable>
      </TableWrapper>

      <BackButton onClick={handleBack}>뒤로가기</BackButton>
    </TeamListContainer>
  );
}
