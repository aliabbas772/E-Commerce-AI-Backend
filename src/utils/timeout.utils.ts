import { GraphQLError } from "graphql";

export const timeout = (ms: number) =>
  new Promise((_, reject) =>
    setTimeout(
      () =>
        reject(
          new GraphQLError(
            "We are experiencing high demand. please try after some time",
          ),
        ),
      ms,
    ),
  );
