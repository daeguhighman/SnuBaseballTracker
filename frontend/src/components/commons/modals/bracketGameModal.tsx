import { useState } from "react";
import moment from "moment-timezone";
import API from "../../../commons/apis/api";
import {
  LoadingIcon,
  LoadingOverlay,
} from "../../../commons/libraries/loadingOverlay";
import { ModalCancleButton, ModalOverlay, ModalTitleSmall } from "./modal.style";
import {
  Field,
  FormFields,
  FormModalContainer,
  SubmitButton,
} from "./adminForm.style";
import { AdminTeamOption } from "./createGameModal";

export interface BracketGame {
  id: number;
  bracketPosition: string;
  /** ISO 문자열. 일정 미정이면 null */
  startTime: string | null;
  status: string;
  home: { teamTournamentId: number | null; name: string | null };
  away: { teamTournamentId: number | null; name: string | null };
}

interface IProps {
  game: BracketGame;
  /** 모달 제목에 쓰는 대진 위치 이름 (예: "8강 1경기") */
  label: string;
  teams: AdminTeamOption[];
  onClose: () => void;
  onDone: () => void;
}

/** 관리 페이지 대진표 탭: 시작 전 대진 경기의 팀·일정을 정한다. 비워 두면 '미정'. */
export default function BracketGameModal({
  game,
  label,
  teams,
  onClose,
  onDone,
}: IProps) {
  const kst = game.startTime ? moment(game.startTime).tz("Asia/Seoul") : null;
  const [date, setDate] = useState(kst?.format("YYYY-MM-DD") ?? "");
  const [time, setTime] = useState(kst?.format("HH:mm") ?? "");
  const [awayId, setAwayId] = useState(
    game.away.teamTournamentId ? String(game.away.teamTournamentId) : ""
  );
  const [homeId, setHomeId] = useState(
    game.home.teamTournamentId ? String(game.home.teamTournamentId) : ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (Boolean(date) !== Boolean(time)) {
      alert("날짜와 시간을 모두 입력하거나 모두 비워 주세요.");
      return;
    }
    if (awayId && awayId === homeId) {
      alert("같은 팀끼리는 경기를 등록할 수 없습니다.");
      return;
    }
    setIsSubmitting(true);
    try {
      await API.patch(`/admin/games/${game.id}/bracket`, {
        awayTeamTournamentId: awayId ? Number(awayId) : null,
        homeTeamTournamentId: homeId ? Number(homeId) : null,
        startTime: date ? `${date}T${time}:00+09:00` : null,
      });
      // 성공하면 부모가 모달을 닫으므로 로딩 상태는 실패할 때만 되돌린다
      onDone();
    } catch (err: any) {
      alert(
        err?.response?.data?.message ?? "저장에 실패했습니다. 다시 시도해 주세요."
      );
      setIsSubmitting(false);
    }
  };

  const teamOptions = (
    <>
      <option value="">미정</option>
      {teams.map((team) => (
        <option key={team.id} value={team.id}>
          {team.group ? `${team.group}조 ` : ""}
          {team.name}
        </option>
      ))}
    </>
  );

  return (
    <ModalOverlay>
      <FormModalContainer>
        <ModalTitleSmall>{label}</ModalTitleSmall>
        <FormFields>
          <Field>
            원정팀 (선공)
            <select value={awayId} onChange={(e) => setAwayId(e.target.value)}>
              {teamOptions}
            </select>
          </Field>
          <Field>
            홈팀 (후공)
            <select value={homeId} onChange={(e) => setHomeId(e.target.value)}>
              {teamOptions}
            </select>
          </Field>
          <Field>
            날짜
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Field>
            시간
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </Field>
        </FormFields>
        <SubmitButton onClick={submit} disabled={isSubmitting}>
          {isSubmitting ? "저장 중…" : "저장하기"}
        </SubmitButton>
        <ModalCancleButton onClick={onClose}>취소</ModalCancleButton>
      </FormModalContainer>
      <LoadingOverlay visible={isSubmitting}>
        <LoadingIcon spin fontSize={48} />
      </LoadingOverlay>
    </ModalOverlay>
  );
}
