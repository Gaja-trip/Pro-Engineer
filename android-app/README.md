# 측량기술사 학습 Android APK

이 폴더는 저장소의 HTML과 `assets/`를 Android WebView에 오프라인으로 묶는 작은 래퍼입니다.
앱은 `today-lecture.html`에서 시작하며, 웹사이트 내부 화면은 APK 안에서 열고 외부 웹 링크는 기기의 기본 브라우저로 넘깁니다.

## 빌드

Windows PowerShell에서 저장소 루트를 기준으로 실행합니다.

```powershell
.\android-app\build-apk.ps1
```

완성 파일은 `dist/ProEngineer-Study-v1.0.0.apk`에 생성됩니다.
현재 빌드는 직접 설치·테스트용 디버그 키로 서명되며 Google Play 배포용 서명은 아닙니다.

## 포함 범위

- 저장소 루트의 모든 HTML 파일
- 전체 `assets/` 폴더
- 인터넷 권한 1개(사용자가 누른 외부 자료 링크용)

카메라, 마이크, 위치, 연락처, 저장소 권한은 요청하지 않습니다.
