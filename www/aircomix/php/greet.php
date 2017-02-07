<?php

# username & password validation
if ($_POST['action'] == "GET")
{
	$url = $_POST['url'];

	# url validation


	$username = $_POST['username'];
	$password = $_POST['password'];

	# Air Comix Server Access
	$context = stream_context_create(array(
		'http' => array(
			'header'  => "Authorization: Basic " . base64_encode("$username:$password")
    	)
	));

	$data = file_get_contents($url, false, $context);

	#print ("<img src='$url' >");  // 이미지일때...

	$item = explode("\n", $data);

	$doc = new DomDocument('1.0', 'UTF-8');

	$root = $doc->createElement('LIST');
	$doc->appendChild($root);

	for ($i=0; $i<count($item); $i++)
	{
		$ext = $doc->createElement('ITEM', $item[$i]);
		$root->appendChild($ext);
	}			

	$xml = $doc->saveXML();

	echo $xml;
}

echo 'ok';

?>
