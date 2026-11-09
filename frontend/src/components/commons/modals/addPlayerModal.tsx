import { useEffect, useState } from "react";
import API from "../../../commons/apis/api";
import {
  LoadingIcon,
  LoadingOverlay,
} from "../../../commons/libraries/loadingOverlay";
import { ModalCancleButton, ModalOverlay, ModalTitleSmall } from "./modal.style";
import {
  CheckRow,
  Field,
  FormFields,
  FormModalContainer,
  Hint,
  ResultItem,
  ResultList,
  SubmitButton,
} from "./adminForm.style";

interface FoundPlayer {
  id: number;
  name: string;
  studentId: string | null;
  college: { id: number; name: string } | null;
  department: { id: number; name: string } | null;
  teams: { teamTournamentId: number; tournamentId: number; label: string }[];
}

interface Option {
  id: number;
  name: string;
  collegeId?: number | null;
}

interface IProps {
  tournamentId: number;
  team: { id: number; name: string };
  onClose: () => void;
  onDone: () => void;
}

type Step = "search" | "existing" | "new";

/**
 * 관리 페이지의 선수 추가.
 * 이전 대회에 뛴 선수는 이름으로 찾아 그대로 등록하고, 처음인 선수는 새로 입력한다.
 */
export default function AddPlayerModal({
  tournamentId,
  team,
  onClose,
  onDone,
}: IProps) {
  const [step, setStep] = useState<Step>("search");
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<FoundPlayer[] | null>(null);
  const [picked, setPicked] = useState<FoundPlayer | null>(null);
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [collegeId, setCollegeId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [isWildcard, setIsWildcard] = useState(false);
  const [isElite, setIsElite] = useState(false);
  const [colleges, setColleges] = useState<Option[]>([]);
  const [departments, setDepartments] = useState<Option[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (step !== "new" || colleges.length > 0) return;
    Promise.all([API.get("/admin/colleges"), API.get("/admin/departments")])
      .then(([c, d]) => {
        setColleges(c.data);
        setDepartments(d.data);
      })
      .catch(() => alert("대학·학과 목록을 불러오지 못했습니다."));
  }, [step, colleges.length]);

  const search = async () => {
    if (!keyword.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await API.get(
        `/admin/players/search?name=${encodeURIComponent(keyword.trim())}`
      );
      setResults(res.data);
    } catch {
      alert("검색에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const register = async (body: Record<string, unknown>) => {
    setIsSubmitting(true);
    try {
      await API.post("/admin/players", {
        tournamentId,
        teamTournamentId: team.id,
        isWildcard,
        isElite,
        ...body,
      });
      onDone();
    } catch (err: any) {
      alert(
        err?.response?.data?.message ?? "등록에 실패했습니다. 다시 시도해 주세요."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const registerNew = () => {
    if (!name.trim() || !studentId.trim() || !collegeId || !departmentId) {
      alert("이름, 학번, 대학, 학과를 모두 입력해 주세요.");
      return;
    }
    register({
      name: name.trim(),
      studentId: studentId.trim(),
      collegeId: Number(collegeId),
      departmentId: Number(departmentId),
    });
  };

  // 학과 데이터 대부분이 대학과 연결돼 있지 않아, 연결된 학과가 없으면 전체를 보여 준다
  const collegeDepartments = departments.filter(
    (d) => String(d.collegeId) === collegeId
  );
  const departmentOptions =
    collegeDepartments.length > 0 ? collegeDepartments : departments;

  const flags = (
    <CheckRow>
      <label>
        <input
          type="checkbox"
          checked={isWildcard}
          onChange={(e) => setIsWildcard(e.target.checked)}
        />
        와일드카드
      </label>
      <label>
        <input
          type="checkbox"
          checked={isElite}
          onChange={(e) => setIsElite(e.target.checked)}
        />
        선출
      </label>
    </CheckRow>
  );

  const renderStep = () => {
    switch (step) {
      case "search":
        return (
          <>
            <ModalTitleSmall>{`${team.name}\n선수 추가`}</ModalTitleSmall>
            <FormFields>
              <Field>
                이름
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && search()}
                  placeholder="예: 홍길동"
                />
              </Field>
            </FormFields>
            <SubmitButton onClick={search} disabled={isSubmitting}>
              기존 선수 찾기
            </SubmitButton>
            {results && (
              <>
                {results.length === 0 ? (
                  <Hint>등록된 적 없는 선수입니다.</Hint>
                ) : (
                  <ResultList>
                    {results.map((p) => {
                      // 한 대회에서는 한 팀에만 등록할 수 있다
                      const registered = p.teams.find(
                        (t) => t.tournamentId === tournamentId
                      );
                      return (
                        <ResultItem key={p.id}>
                          <button
                            disabled={Boolean(registered)}
                            onClick={() => {
                              setPicked(p);
                              setStep("existing");
                            }}
                          >
                            <strong>{p.name}</strong>
                            <span>
                              {[p.department?.name, p.studentId]
                                .filter(Boolean)
                                .join(" · ")}
                              {p.teams.length > 0 &&
                                ` · ${p.teams.map((t) => t.label).join(", ")}`}
                            </span>
                            {registered && (
                              <span>이 대회에 이미 등록된 선수입니다</span>
                            )}
                          </button>
                        </ResultItem>
                      );
                    })}
                  </ResultList>
                )}
                <SubmitButton
                  onClick={() => {
                    setName(keyword.trim());
                    setStep("new");
                  }}
                >
                  새 선수로 등록
                </SubmitButton>
              </>
            )}
            <ModalCancleButton onClick={onClose}>취소</ModalCancleButton>
          </>
        );

      case "existing":
        return (
          <>
            <ModalTitleSmall>{`${picked?.name} 선수를\n${team.name}에 등록할까요?`}</ModalTitleSmall>
            <Hint>
              {[picked?.college?.name, picked?.department?.name, picked?.studentId]
                .filter(Boolean)
                .join(" · ")}
            </Hint>
            <FormFields>{flags}</FormFields>
            <SubmitButton
              onClick={() => picked && register({ playerId: picked.id })}
              disabled={isSubmitting}
            >
              {isSubmitting ? "등록 중…" : "등록하기"}
            </SubmitButton>
            <ModalCancleButton onClick={() => setStep("search")}>
              뒤로
            </ModalCancleButton>
          </>
        );

      case "new":
        return (
          <>
            <ModalTitleSmall>{`${team.name}\n새 선수 등록`}</ModalTitleSmall>
            <FormFields>
              <Field>
                이름
                <input value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field>
                학번
                <input
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="예: 2026-12345"
                />
              </Field>
              <Field>
                대학
                <select
                  value={collegeId}
                  onChange={(e) => {
                    setCollegeId(e.target.value);
                    setDepartmentId("");
                  }}
                >
                  <option value="">선택</option>
                  {colleges.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field>
                학과
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                >
                  <option value="">선택</option>
                  {departmentOptions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </Field>
              {flags}
            </FormFields>
            <SubmitButton onClick={registerNew} disabled={isSubmitting}>
              {isSubmitting ? "등록 중…" : "등록하기"}
            </SubmitButton>
            <ModalCancleButton onClick={() => setStep("search")}>
              뒤로
            </ModalCancleButton>
          </>
        );
    }
  };

  return (
    <ModalOverlay>
      <FormModalContainer>{renderStep()}</FormModalContainer>
      <LoadingOverlay visible={isSubmitting}>
        <LoadingIcon spin fontSize={48} />
      </LoadingOverlay>
    </ModalOverlay>
  );
}
