# Phase 4: 탭 기반 복합 도구

> Duration: 3일
> Prerequisite: [Phase 3 완료](./04-phase-3-complex-panels.md)
> Goal: 가장 복잡한 탭 기반 도구 3개를 shadcn/ui로 마이그레이션

## Overview

이 Phase에서는 가장 복잡한 구조를 가진 탭 기반 도구들을 shadcn/ui 컴포넌트로 교체합니다. 다중 탭, Input, Select 등 다양한 컴포넌트가 조합됩니다.

## Target Panels

| # | 도구 | 탭 수 | 핵심 shadcn 컴포넌트 | 예상 시간 |
|---|------|------|---------------------|----------|
| 4-1 | GridLayout | 5 | Tabs, Card, Slider, Input | 1.5일 |
| 4-2 | ResourceNetwork | 4 | Tabs, Card, Badge, ScrollArea | 1일 |
| 4-3 | TailwindScanner | 3 | Tabs, Card, Badge | 0.5일 |

**총 예상: 3일**

---

## Step 4-1: GridLayout (1.5일)

**파일:** `src/sidepanel/components/GridLayout/`

### 구조 (5개 탭)
1. Guidelines - 가이드라인 오버레이
2. Overlay - 격자 오버레이
3. Dimensions - 측정 도구
4. Viewport - 뷰포트 정보
5. Settings - 설정

### shadcn 컴포넌트
- `<Tabs>`, `<TabsList>`, `<TabsTrigger>`, `<TabsContent>`
- `<Card>`, `<CardContent>`
- `<Slider>`
- `<Input>`
- `<Label>`
- `<Switch>`
- `<Select>`, `<SelectContent>`, `<SelectItem>`, `<SelectTrigger>`, `<SelectValue>`

### 변경 사항

#### 1. Tabs 적용
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

<Tabs defaultValue="guidelines" className="w-full">
  <TabsList className="grid w-full grid-cols-5">
    <TabsTrigger value="guidelines">가이드라인</TabsTrigger>
    <TabsTrigger value="overlay">오버레이</TabsTrigger>
    <TabsTrigger value="dimensions">측정</TabsTrigger>
    <TabsTrigger value="viewport">뷰포트</TabsTrigger>
    <TabsTrigger value="settings">설정</TabsTrigger>
  </TabsList>

  <TabsContent value="guidelines" className="space-y-4">
    {/* 가이드라인 설정 */}
  </TabsContent>

  <TabsContent value="overlay" className="space-y-4">
    {/* 오버레이 설정 */}
  </TabsContent>

  {/* ... */}
</Tabs>
```

#### 2. Input + Label 적용
```tsx
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

<div className="space-y-2">
  <Label htmlFor="width">너비 (px)</Label>
  <Input
    id="width"
    type="number"
    value={width}
    onChange={(e) => setWidth(Number(e.target.value))}
  />
</div>
```

#### 3. Slider 적용
```tsx
import { Slider } from "@/components/ui/slider"

<div className="space-y-2">
  <Label>불투명도: {opacity}%</Label>
  <Slider
    value={[opacity]}
    onValueChange={(value) => setOpacity(value[0])}
    min={0}
    max={100}
    step={1}
  />
</div>
```

#### 4. Switch 적용
```tsx
import { Switch } from "@/components/ui/switch"

<div className="flex items-center justify-between">
  <Label htmlFor="show-grid">격자 표시</Label>
  <Switch
    id="show-grid"
    checked={showGrid}
    onCheckedChange={setShowGrid}
  />
</div>
```

#### 5. Select 적용
```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

<Select value={gridType} onValueChange={setGridType}>
  <SelectTrigger>
    <SelectValue placeholder="격자 타입 선택" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="lines">선</SelectItem>
    <SelectItem value="dots">점</SelectItem>
    <SelectItem value="cross">십자</SelectItem>
  </SelectContent>
</Select>
```

### 확인사항
- [ ] 5개 탭 전환 작동
- [ ] 각 탭별 기능 작동
- [ ] Input, Slider, Switch, Select 조작 작동
- [ ] 다크모드 색상 정상

---

## Step 4-2: ResourceNetwork (1일)

**파일:** `src/sidepanel/components/ResourceNetwork/`

### 구조 (4개 탭)
1. Overview - 개요
2. Resources - 리소스 목록
3. Timeline - 타임라인
4. Waterfall - 워터폴

### shadcn 컴포넌트
- `<Tabs>`, `<TabsList>`, `<TabsTrigger>`, `<TabsContent>`
- `<Card>`, `<CardContent>`
- `<Badge>`
- `<ScrollArea>`
- `<Table>`, `<TableBody>`, `<TableCell>`, `<TableHead>`, `<TableHeader>`, `<TableRow>` (추가 설치 필요)

### 변경 사항

#### 1. Tabs 적용
```tsx
<Tabs defaultValue="overview" className="w-full">
  <TabsList className="grid w-full grid-cols-4">
    <TabsTrigger value="overview">개요</TabsTrigger>
    <TabsTrigger value="resources">리소스</TabsTrigger>
    <TabsTrigger value="timeline">타임라인</TabsTrigger>
    <TabsTrigger value="waterfall">워터폴</TabsTrigger>
  </TabsList>

  <TabsContent value="overview">
    {/* 개요 카드들 */}
  </TabsContent>

  {/* ... */}
</Tabs>
```

#### 2. 개요 통계 Card
```tsx
<div className="grid grid-cols-2 gap-4">
  <Card>
    <CardContent className="p-4">
      <div className="text-2xl font-bold">{totalResources}</div>
      <p className="text-sm text-muted-foreground">전체 리소스</p>
    </CardContent>
  </Card>
  <Card>
    <CardContent className="p-4">
      <div className="text-2xl font-bold">{totalSize}</div>
      <p className="text-sm text-muted-foreground">전체 크기</p>
    </CardContent>
  </Card>
</div>
```

#### 3. 리소스 타입별 Badge
```tsx
<Badge
  variant={
    resource.type === 'script' ? 'default' :
    resource.type === 'stylesheet' ? 'secondary' :
    'outline'
  }
>
  {resource.type}
</Badge>
```

#### 4. Table 적용 (리소스 목록)
```bash
# Table 컴포넌트 추가 설치
npx shadcn@latest add table
```

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>이름</TableHead>
      <TableHead>타입</TableHead>
      <TableHead>크기</TableHead>
      <TableHead>시간</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {resources.map(resource => (
      <TableRow key={resource.id}>
        <TableCell>{resource.name}</TableCell>
        <TableCell>
          <Badge variant="secondary">{resource.type}</Badge>
        </TableCell>
        <TableCell>{resource.size}</TableCell>
        <TableCell>{resource.duration}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### 확인사항
- [ ] 4개 탭 전환 작동
- [ ] 리소스 수신 기능 작동
- [ ] Table 스크롤 작동
- [ ] 다크모드 색상 정상

---

## Step 4-3: TailwindScanner (0.5일)

**파일:** `src/sidepanel/components/TailwindScanner/`

### 구조 (3개 탭)
1. Classes - 클래스 목록
2. Elements - 엘리먼트별
3. Unused - 미사용

### shadcn 컴포넌트
- `<Tabs>`, `<TabsList>`, `<TabsTrigger>`, `<TabsContent>`
- `<Card>`, `<CardContent>`
- `<Badge>`
- `<ScrollArea>`

### 변경 사항

#### 1. Tabs 적용
```tsx
<Tabs defaultValue="classes" className="w-full">
  <TabsList className="grid w-full grid-cols-3">
    <TabsTrigger value="classes">클래스</TabsTrigger>
    <TabsTrigger value="elements">엘리먼트</TabsTrigger>
    <TabsTrigger value="unused">미사용</TabsTrigger>
  </TabsList>

  <TabsContent value="classes">
    <ScrollArea className="h-[400px]">
      {/* 클래스 목록 */}
    </ScrollArea>
  </TabsContent>

  {/* ... */}
</Tabs>
```

#### 2. 클래스 Badge 표시
```tsx
<div className="flex flex-wrap gap-2">
  {classes.map(cls => (
    <Badge key={cls} variant="secondary">
      {cls}
    </Badge>
  ))}
</div>
```

#### 3. 미사용 경고 표시
```tsx
<Card className="border-destructive">
  <CardContent className="p-4">
    <p className="text-destructive">
      {unusedCount}개의 미사용 클래스 발견
    </p>
  </CardContent>
</Card>
```

### 확인사항
- [ ] 3개 탭 전환 작동
- [ ] Tailwind 클래스 스캔 기능 작동
- [ ] ScrollArea 스크롤 작동
- [ ] 다크모드 색상 정상

---

## 추가 컴포넌트 설치

GridLayout의 Table 컴포넌트를 위해:
```bash
npx shadcn@latest add table
```

---

## Completion Criteria

- [ ] GridLayout: 5개 탭, Input, Slider, Switch, Select 적용 완료
- [ ] ResourceNetwork: 4개 탭, Table, Badge 적용 완료
- [ ] TailwindScanner: 3개 탭, ScrollArea, Badge 적용 완료
- [ ] 모든 패널 다크모드 대응 완료
- [ ] 빌드 성공

---

## Next Phase

[Phase 5: 마무리](./06-phase-5-finalization.md)
