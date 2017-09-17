# webcrawler
This is a Node.js based web resource crawler, subscribed to a queue *url* to receive a resource for crawling as a message published by webresource-crawler.

On receiving a message, service starts crawling the resources and storing the results in a mongodb collection.

Requirement:
- Download latest version of Node.js.
- Download and run the MongoDB Server on its default port.
- Download and run the RabbitMQ server.

Download the code and run following commands:
- npm install
- PORT=9080 npm start

Once Service is up and running, it will start working on the messages published by webcrawler-tracker, if any.

To see the visual result of crawling of any resource hit the below URL:

```Resource Site Map
localhost:9080/api/resources/{resource}/sitemap

ex:
localhost:9080/api/resources/wiprodigital.com/sitemap

```


