# Description

The Motorway backend take home code test. Please read the description and the brief carefully before starting the test.

**Please take as long as you wish to complete the test and to add/refactor as much as you think is needed to solve the brief, we recommend around 60 - 120 minutes as a general guide.**

**For anything that you did not get time to implement _or_ that you would like to change/add but you didn't feel was part of the brief, please feel free to make a note of it at the bottom of this README.md file**

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development (local).There is a launch file for VsCode if that is the IDE you like to use.
$ npm run start:dev

# production mode (deployed)
$ npm run start:production
```

## Test

```bash
# run all tests
$ npm run test

# test coverage
$ npm run test:cov
```

## Current Solution

This API is a simple but important API for motorway that is responsible for retrieving valuations for cars from a 3rd party (SuperCar Valuations) by the VRM (Vehicle Registration Mark) and mileage.

- The API has two routes
	- A PUT (/valuations/{vrm}) request to create a valuation for a vehicle which accepts a small amount of input data and performs some simple validation logic.
	- A GET (/valuations/{vrm}) request to get an existing valuation. Returns 404 if no valuation for the vrm exists.  

- The PUT operation handles calling a third-party API to perform the actual valuation, there is some rudimentary mapping logic between Motorway & 3rd party requests/responses.
- The PUT request is not truly idempotent so the 3rd party is called each time this operation is called and the code catches duplicate key exceptions when writing to the database.
- If the 3rd party is unreachable or returns a 5xx error, the service returns a 500 Internal Server Error.
- The outcome is stored in a database for future retrieval in the GET request.
- All the logic for the entire operation is within a single method in a single "service" class.
- A QA engineer has added some high-level tests using Supertest.
- The tests for validation failures all pass.
- A simple happy path test is currently failing as the I/O calls for the database and 3rd party have not been isolated and the clients are trying to hit real resources with an invalid configuration.

## Task Brief

As this is such an important service to Motorway, a decision has been made to add a fallback 3rd party provider called Premium Car Valuations in case SuperCar Valuations is unavailable for a period of time. Before we add any more features, we need to fix the broken test. 

Here are a full list of tasks that need to be completed:

- Modify the code/test so that the existing test suite passes and no I/O calls are made during the execution of the test suite.  

- Add a test for the GET call.

- Introduce a failover mechanism to call the fallback 3rd party provider (Premium Car Valuations) in the event that the failure rate of the calls to SuperCar Valuations exceeds 50%.

- As Premium Car Valuations is more expensive to use, there is a need to revert back to SuperCar Valuations after a configurable amount of time. At this point, the failure rate to indicate failover should be reset.

- If both providers are unreachable or return a 5xx error, then the service should now return a 503 Service Unavailable Error.

- To save costs by avoiding calling either 3rd party, improve the PUT operation so that the providers are not called if an valuation has already occurred. NOTE: This is to save costs, not for any consistency concerns between Motorway and the 3rd party. (Don't worry about concurrency, if two requests for the same route occur at the same time, either response can be saved).

- To help increase customer confidence regarding the valuation Motorway shows the user, there is a new requirement to show the name of the provider who provided the valuation to the user on the front end, e.g. "Valued by Trusted Company {X}", therefore the name of the provider that was used for the valuation needs to be persisted in the database and returned in the response.

- The service should be tolerant to older records where there is no detail of the provider (Backwards Compatible).  

- To help with auditing service level agreements with the providers over an indefinite time period, there is a need to store the following details of the request:     

    - Request date and time    
    - Request duration 
    - Request url 
    - Response code 
    - Error code/message if applicable and the 
    - Name of the provider 

    The details must be stored in a in a ProviderLogs table, which is correlated to a VRM, there could potentially be more than one log per VRM.

- All new functionality should have test coverage in a new or updated existing test.

- Refactor the code as you see fit to ensure it is more readable, maintainable and extensible.

## 3rd Party APIs

For the purposes of this code test, simple mocks have been created use a service called [Mocky](https://designer.mocky.io/) with simple canned responses. Assume, that these would be real RESTful services.  

## 3rd Party OpenAPI Specs

Details of the existing 3rd party (SuperCar Valuations) and the new provider (Premium Car Valuations) can be found here:  

**Note , if you want to execute the swagger specs from swagger hub, you will need to click the "User browser instead" link at the bottom of the page, this stops the hub from firing through a proxy which does not play nice with the Mocking service being used for the purpose of the code test.**  


### SuperCar Valuations

This is the current and preferred provider used for valuations, it is a fairly modern and cost effective API.  

The OpenApi Specification can be found [here](https://app.swaggerhub.com/apis/PaulieWaulie-MW/supercar-valuations/0.1#/default/put_v3_118da5ea_32c5_41e1_9be8_95997cea8e93_valuations__vrm_)  

### Premium Car Valuations

This is the proposed fallback provider to be used for valuations, it is an old service and costs significantly more for each call.

The OpenApi Specification can be found [here](https://app.swaggerhub.com/apis/PaulieWaulie-MW/premium-car-valuations/0.1#/default/get_valueCar)    
   
   
# Candidate Notes
Here is a place for you to put any notes regarding the changes you made and the reasoning and what further changes you wish to suggest.