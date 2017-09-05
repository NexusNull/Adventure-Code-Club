SELECT exchanges.item, exchanges.level, exchanges.result, COUNT(*) AS seen, AVG(amount) AS avg_amount, S.total FROM exchanges
LEFT OUTER JOIN (SELECT item, level, COUNT(*) AS total FROM exchanges GROUP BY item, level) S
ON exchanges.item=S.item
WHERE exchanges.result <> 'gold' GROUP BY exchanges.item, exchanges.result

UNION ALL

SELECT exchanges.item, exchanges.level, exchanges.result, COUNT(*) AS seen, amount, S.total FROM exchanges
LEFT OUTER JOIN (SELECT item, level, COUNT(*) AS total FROM exchanges GROUP BY item, level) S
ON exchanges.item=S.item
WHERE exchanges.result == 'gold' GROUP BY exchanges.item, exchanges.amount;