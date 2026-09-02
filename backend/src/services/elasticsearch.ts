import "dotenv/config";
import { Client } from "@elastic/elasticsearch";

const elasticsearchUrl =
  process.env.ELASTICSEARCH_URL ||
  "http://localhost:9200";

const client = new Client({
  node: elasticsearchUrl,
});

const INDEX_NAME = "emails";

export async function indexEmail(email: {
  id: string;
  recipient: string;
  sender: string;
  subject: string;
  body: string;
  scheduledAt: Date;
  sentAt?: Date | null;
  status: string;
}) {
  await client.index({
    index: INDEX_NAME,
    id: email.id,
    document: {
      id: email.id,
      recipient: email.recipient,
      sender: email.sender,
      subject: email.subject,
      body: email.body,
      scheduledAt: email.scheduledAt,
      sentAt: email.sentAt || null,
      status: email.status,
    },
    refresh: "wait_for",
  });
}

export async function searchEmails(query: string) {
  const result = await client.search({
    index: INDEX_NAME,
    query: {
      multi_match: {
        query,
        fields: [
          "recipient",
          "sender",
          "subject",
          "body",
        ],
      },
    },
  });

  return result.hits.hits.map(
    (hit) => hit._source
  );
}

export async function initializeEmailIndex() {
  const exists = await client.indices.exists({
    index: INDEX_NAME,
  });

  if (!exists) {
    await client.indices.create({
      index: INDEX_NAME,
    });

    console.log(
      `Elasticsearch index "${INDEX_NAME}" created`
    );
  } else {
    console.log(
      `Elasticsearch index "${INDEX_NAME}" already exists`
    );
  }
}

export default client;