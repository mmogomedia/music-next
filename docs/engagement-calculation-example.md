# Engagement Quality Score Calculation Example

## Your Data

- **Follower Count**: 221
- **Total Videos**: 7

## Video Data

| Video | Views | Likes | Comments | Shares | Engagement | Engagement Rate    |
| ----- | ----- | ----- | -------- | ------ | ---------- | ------------------ |
| 1     | 108   | 3     | 0        | 0      | 3          | 3/221 = 1.36%      |
| 2     | 3,254 | 309   | 0        | 1      | 310        | 310/3,254 = 9.52%  |
| 3     | 1,055 | 104   | 0        | 4      | 108        | 108/1,055 = 10.24% |
| 4     | 347   | 16    | 1        | 2      | 19         | 19/347 = 5.48%     |
| 5     | 792   | 68    | 0        | 1      | 69         | 69/792 = 8.71%     |
| 6     | 153   | 8     | 1        | 0      | 9          | 9/153 = 5.88%      |
| 7     | 173   | 13    | 0        | 0      | 13         | 13/173 = 7.51%     |

## Calculation Steps

### A. Engagement Rate Component (60% weight)

For each video:

```
engagement = likes + comments + shares
denominator = max(view_count, follower_count, 100)
engagement_rate = engagement / denominator
```

**Average Engagement Rate:**

- Video 1: 3/221 = 0.0136 (1.36%)
- Video 2: 310/3,254 = 0.0952 (9.52%)
- Video 3: 108/1,055 = 0.1024 (10.24%)
- Video 4: 19/347 = 0.0548 (5.48%)
- Video 5: 69/792 = 0.0871 (8.71%)
- Video 6: 9/153 = 0.0588 (5.88%)
- Video 7: 13/173 = 0.0751 (7.51%)

**Average:** (0.0136 + 0.0952 + 0.1024 + 0.0548 + 0.0871 + 0.0588 + 0.0751) / 7 = **0.0696 (6.96%)**

**Normalization (4%-10% range):**

- Since 6.96% is between 4% and 10%, we use: 60 + ((0.0696 - 0.04) / 0.06) \* 25
- = 60 + (0.0296 / 0.06) \* 25
- = 60 + 0.493 \* 25
- = 60 + 12.33
- **Engagement Rate Score: 72.33**

### B. Average Performance Component (40% weight)

For each video:

```
performance_ratio = view_count / max(follower_count, 100)
```

**Performance Ratios:**

- Video 1: 108/221 = 0.489
- Video 2: 3,254/221 = 14.72
- Video 3: 1,055/221 = 4.77
- Video 4: 347/221 = 1.57
- Video 5: 792/221 = 3.58
- Video 6: 153/221 = 0.692
- Video 7: 173/221 = 0.783

**Average:** (0.489 + 14.72 + 4.77 + 1.57 + 3.58 + 0.692 + 0.783) / 7 = **3.80**

**Normalization (3×+ range):**

- Since 3.80 is > 3.0, we use: 80 + (3.80 - 3.0) \* 5
- = 80 + 0.80 \* 5
- = 80 + 4.0
- **Performance Score: 84.0**

### Final Engagement Quality Score

```
engagement_quality =
  engagement_rate_score * 0.60 +
  performance_score * 0.40

= 72.33 * 0.60 + 84.0 * 0.40
= 43.40 + 33.60
= 77.0
```

**Final Engagement Quality Score: 77.0**

## Summary

- **Engagement Rate Component (60%)**: 72.33 points
  - Average engagement rate: 6.96%
  - This measures how engaged viewers are (likes + comments + shares relative to views/followers)
- **Performance Component (40%)**: 84.0 points
  - Average views per video: 3.80× follower count
  - This measures how well videos perform relative to follower count

- **Combined Score**: 77.0 points (out of 100)

This is a strong engagement score, indicating good audience engagement and video performance relative to follower count.
