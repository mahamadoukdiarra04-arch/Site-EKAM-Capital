<?php
declare(strict_types=1);

$to = 'contact@ekam-capital.com';
$from = 'contact@ekam-capital.com';

function wants_json(): bool
{
    $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
    $requestedWith = $_SERVER['HTTP_X_REQUESTED_WITH'] ?? '';
    return strpos($accept, 'application/json') !== false || $requestedWith === 'XMLHttpRequest';
}

function respond(bool $ok, string $message, int $status = 200): void
{
    http_response_code($status);

    if (wants_json()) {
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode(['ok' => $ok, 'message' => $message], JSON_UNESCAPED_UNICODE);
        exit;
    }

    header('Location: ' . ($ok ? 'merci.html' : 'index.html?contact=erreur#contact'));
    exit;
}

function field(string $name): string
{
    $value = trim((string) ($_POST[$name] ?? ''));
    $value = str_replace("\r", '', $value);
    return strip_tags($value);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Méthode non autorisée.', 405);
}

if (field('website') !== '') {
    respond(true, 'Demande reçue.');
}

$nom = field('nom');
$entreprise = field('entreprise');
$telephone = field('telephone');
$email = field('email');
$typeOrganisation = field('type_organisation');
$service = field('service');
$probleme = field('probleme');
$message = field('message');

if ($nom === '' || $entreprise === '' || $telephone === '' || $service === '') {
    respond(false, 'Merci de remplir les champs obligatoires.', 422);
}

$replyTo = filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : $to;
$subjectTarget = preg_replace('/\s+/', ' ', $entreprise);
$subjectTarget = substr($subjectTarget, 0, 80);
$subject = 'Nouvelle demande de diagnostic EKAM Capital - ' . $subjectTarget;
$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';

$body = implode("\n", [
    'Nouvelle demande de diagnostic depuis le site EKAM Capital',
    '',
    'Nom et prénom: ' . $nom,
    "Nom de l'entreprise: " . $entreprise,
    'Téléphone / WhatsApp: ' . $telephone,
    'Email: ' . ($email !== '' ? $email : 'Non renseigné'),
    "Type d'organisation: " . ($typeOrganisation !== '' ? $typeOrganisation : 'Non renseigné'),
    'Service recherché: ' . $service,
    '',
    'Problème principal rencontré:',
    $probleme !== '' ? $probleme : 'Non renseigné',
    '',
    'Message:',
    $message !== '' ? $message : 'Non renseigné',
    '',
    'Date de réception: ' . date('Y-m-d H:i:s T'),
]);

$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'From: EKAM Capital <' . $from . '>',
    'Reply-To: ' . $replyTo,
    'X-Mailer: PHP/' . phpversion(),
];

$sent = mail($to, $encodedSubject, $body, implode("\r\n", $headers));

if (!$sent) {
    respond(false, "L'e-mail n'a pas pu être envoyé.", 500);
}

respond(true, 'Demande reçue.');
