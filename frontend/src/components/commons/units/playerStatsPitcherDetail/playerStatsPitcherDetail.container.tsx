import React, { useState, useEffect, useCallback } from "react";
import {
  RankingContainer,
  TableWrapper,
  RankingTableP,
  TableTitle,
  ArrowIcon,
  RankingTable,
} from "./playerStatsPitcherDetail.style";
import { useRecoilState } from "recoil";
import { pitcherStatsState } from "../../../../commons/stores";
import { ArrowIconNone } from "../playerStats/playerStats.style";
import API from "../../../../commons/apis/api";
import {
  SearchContainer,
  SearchInput,
} from "../playerStatsBatterDetail/playerStatsBatterDetail.style";

export default function StatsPagePitcherDetail() {
  const [pitcherStats] = useRecoilState(pitcherStatsState);
  const [error, setError] = useState(null);

  // 검색 관련 상태 추가
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchPitchers = async () => {
      try {
        const res = await API.get("/tournaments/1/records/pitchers");
        const sorted = res.data.pitchers.sort((a, b) => b.K - a.K);
        setPitcherData(sorted);
      } catch (e) {
        setError(e);
        const errorCode = e?.response?.data?.errorCode;
        console.error(e, "errorCode:", errorCode);
        console.error("Error fetching pitcher stats:", e);
      }
    };
    fetchPitchers();
  }, []);

  const [pitcherData, setPitcherData] = useState(
    [...pitcherStats].sort((a, b) => b.K - a.K)
  );
  const [pitcherSortKey, setPitcherSortKey] = useState("K");

  useEffect(() => {
    const sortedData = [...pitcherStats].sort((a, b) => b.K - a.K);
    setPitcherData(sortedData);
  }, []);

  // 디바운스 효과 추가
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearching(searchTerm.trim().length > 0);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 검색 필터링 함수 추가
  const filterBySearch = useCallback(
    (data: typeof pitcherData) => {
      if (!debouncedSearchTerm.trim()) return data;

      return data.filter((item) =>
        item.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    },
    [debouncedSearchTerm]
  );

  const handleSortPitcher = (key: string) => {
    setPitcherSortKey(key);
    const sortedData = [...pitcherData].sort(
      (a, b) => (b[key] as number) - (a[key] as number)
    );
    setPitcherData(sortedData);
  };

  const getArrow = (currentKey: string, columnKey: string) =>
    currentKey === columnKey ? "▼" : "▲";

  const formatInnings = (ip: number): string => {
    if (!ip || ip === 0) return "0";

    const fullInnings = Math.floor(ip / 3);
    const outs = ip % 3;

    if (outs === 0) {
      return fullInnings.toString();
    } else {
      return `${fullInnings} ${outs}/3`;
    }
  };

  // 화면에 표시할 데이터 선택
  const displayData = isSearching ? filterBySearch(pitcherData) : pitcherData;

  // 전체 데이터에서의 순위를 계산하는 함수 추가
  const getOverallRank = (item: (typeof pitcherData)[0]) => {
    const allData = pitcherData; // 전체 투수 데이터
    const sortedData = [...allData].sort((a, b) => {
      const aValue = a[pitcherSortKey] as number;
      const bValue = b[pitcherSortKey] as number;
      return bValue - aValue;
    });

    // 동점자 처리
    let currentRank = 1;
    let tieCount = 0;
    let prevValue: number | null = null;

    for (let i = 0; i < sortedData.length; i++) {
      const currentValue = sortedData[i][pitcherSortKey] as number;

      if (i === 0) {
        currentRank = 1;
        tieCount = 1;
        prevValue = currentValue;
      } else {
        if (currentValue === prevValue) {
          tieCount++;
        } else {
          currentRank += tieCount;
          tieCount = 1;
          prevValue = currentValue;
        }
      }

      // 현재 아이템을 찾으면 순위 반환
      if (
        sortedData[i].name === item.name &&
        sortedData[i].team === item.team
      ) {
        return currentRank;
      }
    }

    return 1; // 기본값
  };

  return (
    <RankingContainer>
      <TableTitle>투수기록</TableTitle>

      {/* 검색 입력창 추가 */}
      <SearchContainer>
        <SearchInput
          type="text"
          placeholder="선수명을 입력하세요"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </SearchContainer>

      <TableWrapper>
        <RankingTable>
          <thead>
            <tr>
              <th style={{ width: "11vw" }}>순위</th>
              <th style={{ width: "25vw", textAlign: "left" }}>선수</th>
              <th onClick={() => handleSortPitcher("K")}>
                삼진 <ArrowIcon>{getArrow(pitcherSortKey, "K")}</ArrowIcon>
              </th>
              {/* <th onClick={() => handleSortPitcher("ERA")}>
                ERA <ArrowIcon>{getArrow(pitcherSortKey, "ERA")}</ArrowIcon>
              </th> */}
              <th onClick={() => handleSortPitcher("IP")}>
                이닝 <ArrowIcon>{getArrow(pitcherSortKey, "IP")}</ArrowIcon>
              </th>
              <th onClick={() => handleSortPitcher("R")}>
                실점 <ArrowIcon>{getArrow(pitcherSortKey, "R")}</ArrowIcon>
              </th>
              {/* <th onClick={() => handleSortPitcher("ER")}>
                자책 <ArrowIcon>{getArrow(pitcherSortKey, "ER")}</ArrowIcon>
              </th> */}

              <th onClick={() => handleSortPitcher("BB")}>
                사사구 <ArrowIcon>{getArrow(pitcherSortKey, "BB")}</ArrowIcon>
              </th>
            </tr>
          </thead>
          <tbody>
            {displayData.slice(0, 20).map((item, index) => (
              <tr key={index}>
                <td>{getOverallRank(item)}</td>
                <td style={{ textAlign: "left" }}>
                  {item.name?.slice(0, 3)} ({item.team?.slice(0, 3) || "N/A"})
                </td>
                <td>
                  {item.K} <ArrowIconNone> ▽ </ArrowIconNone>
                </td>
                {/* <td>
                  {item.ERA} <ArrowIconNone> ▽ </ArrowIconNone>
                </td> */}
                <td>
                  {formatInnings(item.IP)}
                  <ArrowIconNone> ▽ </ArrowIconNone>
                </td>
                <td>
                  {item.R} <ArrowIconNone> ▽ </ArrowIconNone>
                </td>
                {/* <td>
                  {item.ER} <ArrowIconNone> ▽ </ArrowIconNone>
                </td> */}

                <td>
                  {item.BB} <ArrowIconNone> ▽ </ArrowIconNone>
                </td>
              </tr>
            ))}
          </tbody>
        </RankingTable>
      </TableWrapper>
    </RankingContainer>
  );
}
