# HTTP plugin
This plugin brings basic HTTP functionality to Bridge, such as items that make requests.  

Stopping an HTTP item immediately aborts any requests started by playing it. Playing an item multiple times while requests are still running will result in multiple requests being made.

## User agent
All requests will be tagged by Bridge's user agent string, formatted as `Bridge/<version>` for easier identification.
