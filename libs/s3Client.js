/* Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0
ABOUT THIS NODE.JS EXAMPLE: This example works with the AWS SDK for JavaScript version 3 (v3),
which is available at https://github.com/aws/aws-sdk-js-v3. This example is in the 'AWS SDK for JavaScript v3 Developer Guide' at
https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/s3-example-creating-buckets.html.

Purpose:
s3Client.js is a helper function that creates an Amazon Simple Storage Service (Amazon S3) service client.

Inputs (replace in code):
  - REGION

*/
// Create service client module using ES6 syntax.
// import { S3Client } from "@aws-sdk/client-s3";
const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");
// Set the AWS Region.
const REGION = "ap-southeast-1"; //e.g. "us-east-1"
// Create an Amazon S3 service client object.
const s3Client = new S3Client({ region: REGION });
// export { s3Client };
