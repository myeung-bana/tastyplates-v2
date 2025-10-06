#!/bin/bash

# Fix the favorite endpoint to handle JSON data properly
sed -i '' '1667,1669c\
                $body = json_decode($request->get_body(), true);\
                $restaurant_slug = isset($body["restaurant_slug"]) ? sanitize_title($body["restaurant_slug"]) : (isset($request["restaurant_slug"]) ? sanitize_title($request["restaurant_slug"]) : "");\
                $action = isset($body["action"]) ? $body["action"] : (isset($request["action"]) ? $request["action"] : "");\
                $listing = get_page_by_path($restaurant_slug, OBJECT, "listing");' documentation/dev-chrono-plugin.php
