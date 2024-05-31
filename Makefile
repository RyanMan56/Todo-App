.PHONY: aws-login
aws-login:
	aws sso login --profile rbj-ryan-admin

.PHONY: backend
backend:
	cd backend && go run .

.PHONY: build
build:
	cd backend && GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -tags lambda.norpc -o bootstrap main.go

.PHONY: deploy
deploy:
	cd infra && yarn deploy

.PHONY: watch
watch:
	cd infra && yarn watch