-- prisma/sql/getLabelsWithCardLabel.sql

-- @param {String} $1:cardId The ID of the card to match

SELECT 
  l.id         AS "labelId",
  l.title      AS "labelTitle",
  l.color      AS "labelColor",
  cl.id        AS "cardLabelId",
  cl."cardId"  AS "cardId",
  cl.checked   AS "isChecked"
FROM "labels" l
LEFT JOIN "card_labels" cl
  ON l.id = cl."labelId"
  AND cl."cardId" = $1;
