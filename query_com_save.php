<?php
$content = file_get_contents('/Users/sonysum/Documents/Web-Project/meanchey-api/api/actions/employee/MyCompanyAction.php');
$start = strpos($content, 'function comSave');
$end = strpos($content, 'function', $start + 20);
echo substr($content, $start, $end - $start);
