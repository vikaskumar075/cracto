import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

const errorRate = new Rate("errors");

// Target URL — override with K6_TARGET_URL env var
const BASE_URL = __ENV.K6_TARGET_URL || "http://localhost:3000";
const GRAPHQL_URL = `${BASE_URL}/api/graphql`;

const HEADERS = {
  "Content-Type": "application/json",
};

// Stage 1: ramp up to find the breaking point
// Stage 2: sustained load
// Stage 3: ramp down
export const options = {
  stages: [
    { duration: "30s", target: 20 },   // warm up
    { duration: "60s", target: 50 },   // baseline
    { duration: "60s", target: 100 },  // stress
    { duration: "60s", target: 200 },  // heavy load
    { duration: "30s", target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"], // 95% of requests < 2s
    errors: ["rate<0.05"],             // error rate < 5%
  },
};

function gql(query, variables = {}) {
  return JSON.stringify({ query, variables });
}

const GET_RELEASES_QUERY = `
  query { releases { id name status date stepsCompleted } }
`;

const CREATE_RELEASE_MUTATION = `
  mutation CreateRelease($name: String!, $date: String!) {
    createRelease(name: $name, date: $date) { id name status }
  }
`;

export default function () {
  // 80% read, 20% write — typical workload distribution
  const rand = Math.random();

  if (rand < 0.8) {
    // Read all releases
    const res = http.post(GRAPHQL_URL, gql(GET_RELEASES_QUERY), { headers: HEADERS });
    const ok = check(res, {
      "releases query succeeded": (r) => r.status === 200,
      "no GraphQL errors": (r) => {
        try {
          const body = JSON.parse(r.body);
          return !body.errors || body.errors.length === 0;
        } catch {
          return false;
        }
      },
    });
    errorRate.add(!ok);
  } else {
    // Create a release
    const name = `k6 Release ${Date.now()}`;
    const date = new Date().toISOString();
    const res = http.post(
      GRAPHQL_URL,
      gql(CREATE_RELEASE_MUTATION, { name, date }),
      { headers: HEADERS }
    );
    const ok = check(res, {
      "create release succeeded": (r) => r.status === 200,
    });
    errorRate.add(!ok);
  }

  sleep(0.5);
}
