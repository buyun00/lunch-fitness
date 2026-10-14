# 午休健身计划（静态页）

给 Lumi 用的深色、手机优先健身安排页：看「今天」和「历史」。

## 本地预览

```bash
cd /workspace/fitness/web
python3 -m http.server 8765
```

浏览器打开 `http://localhost:8765`（或本机局域网 IP）。

用 `file://` 打开时，部分浏览器会拦截 `fetch('./data/plan.json')`，请用本地 HTTP 服务。

## 更新计划

编辑 `data/plan.json`：

| 字段 | 用途 |
|---|---|
| `templates.*` | 力量 A/B、椭圆机、休息日的动作清单 |
| `schedule` | 按星期几（0=周日 … 6=周六）默认模板 id |
| `overrides` | 某天强制用哪个模板，格式 `YYYY-MM-DD` |
| `history` | 已完成记录：`date / weekday / title / status / notes / felt` |

勾选状态存在浏览器 `localStorage`（键前缀 `lunch-fitness-checks:`），只影响本机本浏览器。

## 时区

「今天」按 **Asia/Shanghai** 计算，与服务器时区无关。

## 发布 GitHub Pages

1. 新建公开仓库（例如 `buyun00/lunch-fitness`）
2. 把本目录内容推到 `main` 根目录（或 `docs/`）
3. Settings → Pages → Source: Deploy from branch → `main` / root
4. 访问 `https://buyun00.github.io/lunch-fitness/`

## 说明

- 不提供医疗建议。
- 设备与计划事实来自 `减脂与午休健身计划_AI交接文档_2026-10-14.md`。

## 一键发布（本机已装 gh）

```bash
cd /workspace/fitness/web
gh auth login   # 若尚未登录
./publish.sh buyun00/lunch-fitness
```

预计公开地址：`https://buyun00.github.io/lunch-fitness/`
