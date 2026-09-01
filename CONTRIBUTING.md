# Contribution Rules / 素材提交规则

These rules keep the Week 1 evidence traceable, legal, reproducible, and easy to review.  
以下规则用于保证 Week 1 素材来源清楚、可复现、合规，并便于统一筛选。

## 1. Do not edit `main` directly / 不要直接修改主分支

1. Create a branch named `materials/<github-username>`.
2. Add all of your material under `materials/<github-username>/`.
3. Open a pull request titled `[Materials] <username> - <topic>`.
4. Wait for at least one teammate to review it before merging.

Every member should use their own GitHub account so that the contribution history can be used as evidence of participation.

每位成员必须使用自己的 GitHub 账号，以便提交记录能够证明个人贡献。

## 2. Required folder structure / 必须使用的目录结构

```text
materials/<github-username>/
  MATERIALS.md
  data/
  figures/
  scripts/
  references/
```

Do not create files directly in the repository root unless the team has agreed to do so.

## 3. Complete a material record / 填写素材说明

Copy [MATERIAL_SUBMISSION_TEMPLATE.md](MATERIAL_SUBMISSION_TEMPLATE.md) to your folder and rename it `MATERIALS.md`.

Every paper, dataset, figure, or code source must include:

- title and short description;
- original URL, DOI, or repository link;
- author or organisation;
- access date;
- licence or reuse status, if known;
- whether the data are real, preprocessed, or synthetic;
- what you propose to change, redraw, calculate, or visualise;
- how the material supports the Week 1 poster;
- any limitations or risks.

A file without a source record may be rejected.

没有来源说明的素材可以直接不采用。

## 4. Data integrity / 数据真实性

- Never invent a source, citation, result, or statistic.
- Real and preprocessed data are preferred.
- Synthetic data must be clearly labelled `synthetic data` and must not be used as proof of a real-world market trend.
- Do not combine datasets with different definitions, currencies, periods, or geographic scopes without explaining the difference.
- Keep raw data unchanged where redistribution is permitted; put cleaned data in a separate file.
- Record every important cleaning or transformation step in code or in `MATERIALS.md`.

## 5. Papers, figures, and copyright / 论文、图片与版权

- Prefer open-access papers and official datasets.
- Do not upload a copyrighted paper PDF or a publisher's original figure unless redistribution is clearly permitted.
- Normally, store the paper link, DOI, page number, and citation instead of the complete PDF.
- Redrawn or adapted figures must be visibly labelled `Adapted from ...`.
- Do not remove watermarks, crop away attribution, or present another person's figure as original work.
- If the licence is unclear, submit only the source link and a low-resolution review screenshot; the team will decide whether it can be used.

## 6. Code and reproducibility / 代码与可复现性

- Preferred formats: `.py`, `.ipynb`, `.R`, `.csv`, `.json`, `.xlsx`, `.png`, `.svg`, and `.pdf`.
- Scripts must state their input file and expected output.
- Add comments for non-obvious data transformations.
- Do not upload passwords, GitHub tokens, API keys, cookies, or private configuration files.
- Use relative paths rather than personal absolute paths such as `C:\Users\...`.
- Large datasets should remain at their official source; provide a download link and a small permitted sample where appropriate.

## 7. Privacy and process evidence / 隐私与过程证据

The repository is public. Do not upload raw group-chat exports.

公开仓库禁止直接上传完整聊天记录。

A process screenshot may be uploaded only when:

- it is directly relevant to topic selection, data checking, coding, poster design, or team organisation;
- unrelated messages have been cropped out;
- phone numbers, student IDs, private account details, and unrelated names or avatars have been hidden;
- the people shown have agreed to its use;
- a short caption explains the date, activity, contributor, and what the screenshot proves.

Keep original private evidence outside the public repository.

## 8. File naming / 文件命名

Use descriptive lowercase names with hyphens or underscores.

Examples:

```text
china-online-retail-2019-2025.csv
clean_crossborder_data.py
figure-platform-ecosystem-adapted.svg
source-notes.md
```

Avoid names such as `new1.png`, `final-final2.xlsx`, or `123.pdf`.

## 9. Commit messages / 提交说明

Use one of these prefixes:

- `data:` dataset or cleaning change
- `figure:` visualisation or image
- `code:` script or notebook
- `source:` paper, dataset, or citation record
- `docs:` documentation
- `evidence:` privacy-safe process evidence

Example: `figure: add redrawn cross-border e-commerce growth chart`

## 10. Pull-request checklist / 合并前检查

Before opening a pull request, confirm:

- [ ] My work is inside `materials/<github-username>/`.
- [ ] `MATERIALS.md` is complete.
- [ ] Every claim, figure, and dataset has a working source link.
- [ ] Data type is labelled real, preprocessed, or synthetic.
- [ ] Copyright and licence status have been considered.
- [ ] No private information, credentials, or unredacted chat logs are included.
- [ ] Code and figures have meaningful filenames.
- [ ] I have explained my own contribution.
- [ ] The material is relevant to the official Week 1 theme.

Submitting material does not guarantee that it will appear in the final poster. The team will select sources according to relevance, reliability, visual quality, and reproducibility.
