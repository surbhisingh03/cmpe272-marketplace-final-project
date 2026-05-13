<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/db.php';

try {
  $visitToday = (int) $pdo->query(
    "SELECT COUNT(*) FROM visits WHERE DATE(visited_at) = CURDATE()"
  )->fetchColumn();

  $reviewToday = (int) $pdo->query(
    "SELECT COUNT(*) FROM reviews WHERE status = 'published' AND DATE(created_at) = CURDATE()"
  )->fetchColumn();

  $signupToday = (int) $pdo->query(
    "SELECT COUNT(*) FROM users WHERE DATE(created_at) = CURDATE()"
  )->fetchColumn();

  $activeToday = (int) $pdo->query(
    "SELECT COUNT(DISTINCT user_id) FROM visits WHERE DATE(visited_at) = CURDATE()"
  )->fetchColumn();

  $userTotal = (int) $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();

  $stmtTopVisit = $pdo->query("
    SELECT p.name AS productName, COUNT(*) AS n
    FROM visits v
    JOIN products p ON p.id = v.product_id
    WHERE DATE(v.visited_at) = CURDATE()
    GROUP BY p.id, p.name
    ORDER BY n DESC
    LIMIT 1
  ");
  $topVisit = $stmtTopVisit->fetch(PDO::FETCH_ASSOC);
  $topProductName = $topVisit ? $topVisit['productName'] : '—';

  $stmtWeek = $pdo->query("
    SELECT p.name AS productName, COUNT(*) AS n
    FROM reviews r
    JOIN products p ON p.id = r.product_id
    WHERE r.status = 'published'
      AND r.created_at >= (CURDATE() - INTERVAL 6 DAY)
    GROUP BY p.id, p.name
    ORDER BY n DESC
    LIMIT 1
  ");
  $topWeek = $stmtWeek->fetch(PDO::FETCH_ASSOC);
  $topProductWeekName = $topWeek ? $topWeek['productName'] : $topProductName;

  echo json_encode([
    'visitCountToday' => $visitToday,
    'reviewCountToday' => $reviewToday,
    'signupCountToday' => $signupToday,
    'activeUsersToday' => $activeToday,
    'userCount' => $userTotal,
    'topProductName' => $topProductName,
    'topProductWeekName' => $topProductWeekName,
  ]);
} catch (Throwable $e) {
  http_response_code(503);
  echo json_encode(['error' => 'Stats unavailable']);
}
