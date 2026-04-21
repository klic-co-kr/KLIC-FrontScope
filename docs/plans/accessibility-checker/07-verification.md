# Phase 7: Verification (Tasks 48-50)

> Build verification, lint, manual E2E checklist

---

## Task 48: Full Build Verification

**Step 1: Type check**

Run: `tsc -b`
Expected: No errors

**Step 2: Build**

Run: `npm run build`
Expected: Build succeeds, produces updated:
- `dist/assets/content.js` (includes accessibility scanner)
- `dist/assets/sidepanel.js` (includes AccessibilityPanel)
- `dist/assets/background.js` (includes context menu entry)

**Step 3: Lint**

Run: `npm run lint`
Expected: No errors (fix any that appear)

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix(a11y): resolve build and lint issues"
```

---

## Task 49: Unit Test Verification

Run all accessibility-related tests:

```bash
npx vitest run src/types/__tests__/accessibility.test.ts
npx vitest run src/utils/accessibility/__tests__/
npx vitest run src/hooks/accessibility/__tests__/
```

Expected: All tests pass, ≥ 80% coverage for validator modules.

Check coverage:
```bash
npx vitest run --coverage src/utils/accessibility/
```

---

## Task 50: Manual E2E Verification Checklist

Load the extension in Chrome and verify:

### 1. Extension loads without errors
- `chrome://extensions/` → Load unpacked → select `dist/`
- No errors in extension card
- Service worker starts successfully

### 2. Tool registration
- Open Side Panel
- Verify: "접근성 검사" tool visible in tool list with ShieldCheck icon
- Verify: Tool is in "analyze" category
- Verify: Shortcut `Ctrl+Shift+A` works

### 3. Initial UI state
- Click "접근성 검사" tool
- Verify: AccessibilityPanel displays with:
  - Header: "접근성 검사" with settings gear icon and "비활성화" button
  - Scan button: "접근성 검사 시작" (blue, full width)
  - No report shown initially

### 4. Settings panel
- Click settings gear icon
- Verify: Settings panel expands with:
  - 6 category toggles (all ON by default)
  - 5 severity filter toggles (all ON by default)
  - Max elements slider (default 1000)
  - Include hidden toggle (default OFF)
  - Auto-scan toggle (default ON)
  - Reset button

### 5. Scan execution
- Navigate to a test page (e.g., https://www.gov.kr or any Korean government site)
- Click "접근성 검사 시작"
- Verify: Button changes to "검사 중..." with spinner
- Verify: Scan completes within 3 seconds
- Verify: ScoreCard appears with:
  - Circular progress (0-100 score)
  - Grade badge (A/B/C/D/F)
  - KRDS 준수/미준수 badge (if score ≥ 75)
  - Pass count and scan duration

### 6. Report tabs
- Verify: CategoryTabs shows 7 tabs: 요약 | HTML | 색상 | 타이포 | 컴포넌트 | 반응형 | 토큰
- Verify: Each tab with issues shows badge count
- Verify: SummaryTab shows all categories with mini progress bars
- Verify: CategoryDetail tabs show category-specific issues

### 7. Issue display
- Verify: Issues sorted by severity (심각 → 높음 → 보통 → 낮음 → 정보)
- Verify: Each issue has:
  - Severity badge (colored)
  - Message (Korean)
  - Expandable details (click to see element selector, fix suggestion)
  - WCAG and/or KRDS criteria badges
- Verify: "페이지에서 찾기" button highlights the element on the page

### 8. Element highlighting
- Click "페이지에서 찾기" on an issue
- Verify: Page scrolls to the element
- Verify: Element highlighted with red outline for 3 seconds
- Verify: Highlight disappears after timeout

### 9. Re-scan
- Click "다시 검사"
- Verify: New scan runs and results update

### 10. Export
- Click export button
- Verify: JSON export produces valid JSON file
- Verify: CSV export produces valid CSV file
- Verify: HTML export produces styled, printable report

### 11. Severity filtering
- Open settings
- Disable "정보" severity
- Verify: INFO-level issues hidden from issue lists
- Re-enable and verify they reappear

### 12. Category filtering
- Disable "디자인 토큰" category
- Re-scan
- Verify: Token validation not included in results

### 13. Settings persistence
- Change settings, close and reopen side panel
- Verify: Settings preserved

### 14. Coexistence with other tools
- Activate CSS Scan tool alongside Accessibility Checker
- Verify: Both work without interference

### 15. Context menu
- Right-click on any page
- Verify: "KLIC-Tool" → "접근성 검사" option visible
- Click it → Side Panel opens with Accessibility Checker active

### 16. Different page types
Test on:
- [x] Korean government site (www.gov.kr)
- [x] Simple HTML page (local test)
- [x] Complex SPA (React app)
- [x] Page with many images
- [x] Page with forms
- [x] Mobile-optimized page

---

## Test Page Recommendations

For consistent testing, create a local test page that intentionally includes accessibility issues:

```html
<!DOCTYPE html>
<html>  <!-- Missing lang attribute -->
<head><title>Accessibility Test Page</title></head>
<body>
  <img src="test.png">  <!-- Missing alt -->
  <a href="#"></a>  <!-- Empty link -->
  <div style="color: #aaa; background: #fff">Low contrast text</div>
  <input type="text">  <!-- Missing label -->
  <table><tr><td>No headers</td></tr></table>
  <h1>Title</h1>
  <h3>Skipped h2</h3>  <!-- Heading order skip -->
  <button style="width: 20px; height: 20px">X</button>  <!-- Too small -->
  <div style="font-size: 10px">Tiny text</div>  <!-- Below minimum -->
</body>
</html>
```

This page should score approximately 30-40/100 (Grade D/F) and trigger issues across all 6 categories.
