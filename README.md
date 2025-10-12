# 콘텐츠 업데이트 절차

1. `/content/*.md` 파일을 수정합니다.
2. `npm run content:build` 명령으로 정적 페이지를 갱신합니다.
3. 변경 사항을 Commit & Push 합니다.

---
템플릿과 라이선스 정보는 기존 `README.txt`를 참고하세요.

## 체크리스트
- [ ] GitHub Pages: Settings → Pages → Branch main / root
- [x] index.html 루트 배치
- [x] 라이선스 표기(Design: HTML5 UP) 유지
- [x] 이미지 경로 상대경로화 완료
- [ ] /content/*.md 편집 → npm run content:build → 반영 OK
- [ ] 링크/앵커 정상 스크롤 이동
- [ ] 모바일(<=640px) 레이아웃 확인

## 배포 확인
- https://<username>.github.io/<repo>/

## 콘텐츠 편집
- 텍스트는 `/content/*.md`에 Markdown으로 작성합니다.
- 이미지 업로드는 `/images`에 추가하고 Markdown에서 `![](./images/파일명)` 형태로 불러옵니다.
- GitHub Pages는 Settings → Pages → main / (root) 설정을 사용합니다.
- Open Graph 이미지와 URL은 절대경로를 사용해야 합니다.
