import { gql } from "@apollo/client/core";

export const RELEASE_FIELDS = gql`
  fragment ReleaseFields on Release {
    id
    name
    date
    status
    additionalInfo
    stepsCompleted
    createdAt
    updatedAt
  }
`;

export const GET_RELEASES = gql`
  ${RELEASE_FIELDS}
  query GetReleases {
    releases {
      ...ReleaseFields
    }
  }
`;

export const GET_RELEASE = gql`
  ${RELEASE_FIELDS}
  query GetRelease($id: ID!) {
    release(id: $id) {
      ...ReleaseFields
    }
  }
`;

export const CREATE_RELEASE = gql`
  ${RELEASE_FIELDS}
  mutation CreateRelease($name: String!, $date: String!, $additionalInfo: String) {
    createRelease(name: $name, date: $date, additionalInfo: $additionalInfo) {
      ...ReleaseFields
    }
  }
`;

export const UPDATE_RELEASE = gql`
  ${RELEASE_FIELDS}
  mutation UpdateRelease($id: ID!, $additionalInfo: String, $stepsCompleted: [Int!]) {
    updateRelease(id: $id, additionalInfo: $additionalInfo, stepsCompleted: $stepsCompleted) {
      ...ReleaseFields
    }
  }
`;

export const DELETE_RELEASE = gql`
  mutation DeleteRelease($id: ID!) {
    deleteRelease(id: $id)
  }
`;
