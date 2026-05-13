<?php
/**
 * MySQL activity feed — deploy beside partner sites or proxy to this file.
 * JSON shape matches GET /api/marketplace/activity-feed (Node) for the React client.
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/db.php';

$limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 20;
$limit = max(1, min($limit, 50));
$since = isset($_GET['since']) ? (int) $_GET['since'] : 0;

$reviews = $pdo->prepare("
  SELECT
    'review' AS type,
    r.id,
    u.display_name AS user_name,
    p.name AS product_name,
    c.name AS company_name,
    c.slug AS company_slug,
    r.rating,
    SUBSTRING(r.body, 1, 500) AS review_text,
    UNIX_TIMESTAMP(r.created_at) AS timestamp,
    r.product_id AS product_id
  FROM reviews r
  JOIN users u ON r.user_id = u.id
  JOIN products p ON r.product_id = p.id
  JOIN companies c ON p.company_id = c.id
  WHERE r.status = 'published'
    AND UNIX_TIMESTAMP(r.created_at) > ?
  ORDER BY r.created_at DESC
  LIMIT " . (int) $limit
);
$reviews->execute([$since]);

$visits = $pdo->prepare("
  SELECT
    'visit' AS type,
    v.id,
    u.display_name AS user_name,
    p.name AS product_name,
    c.name AS company_name,
    c.slug AS company_slug,
    NULL AS rating,
    NULL AS review_text,
    UNIX_TIMESTAMP(v.visited_at) AS timestamp,
    v.product_id AS product_id
  FROM visits v
  JOIN users u ON v.user_id = u.id
  JOIN products p ON v.product_id = p.id
  JOIN companies c ON p.company_id = c.id
  WHERE UNIX_TIMESTAMP(v.visited_at) > ?
  ORDER BY v.visited_at DESC
  LIMIT " . (int) $limit
);
$visits->execute([$since]);

$signups = $pdo->prepare("
  SELECT
    'signup' AS type,
    u.id,
    u.display_name AS user_name,
    NULL AS product_name,
    NULL AS company_name,
    NULL AS company_slug,
    NULL AS rating,
    NULL AS review_text,
    UNIX_TIMESTAMP(u.created_at) AS timestamp,
    NULL AS product_id
  FROM users u
  WHERE UNIX_TIMESTAMP(u.created_at) > ?
  ORDER BY u.created_at DESC
  LIMIT 5
");
$signups->execute([$since]);

$all = array_merge(
  $reviews->fetchAll(PDO::FETCH_ASSOC),
  $visits->fetchAll(PDO::FETCH_ASSOC),
  $signups->fetchAll(PDO::FETCH_ASSOC)
);

usort($all, function ($a, $b) {
  return (int) $b['timestamp'] - (int) $a['timestamp'];
});
$all = array_slice($all, 0, $limit);

echo json_encode([
  'activities' => $all,
  'server_time' => time(),
  'count' => count($all),
]);
