<?PHP

$passwd="zhalr!@#";

if (strlen($passwd) > 0 && $_SERVER['PHP_AUTH_PW'] != $passwd)
{
    header("WWW-Authenticate: Basic realm=\"Password Required\"");
    header('HTTP/1.0 401 Unauthorized');
    exit;
}

?>
