# Log output application for 1.2 Exercise of Devops with Kubernetes

This application is written in node.js express, there is an image created with the
dockerfile [here]([https://hub.docker.com/repository/docker/zelhs/randomstring/general](https://hub.docker.com/repository/docker/zelhs/project_server/general)).

It creates a server that listens by default to port **4000**, or any you put to the env variables

In order to run with kubernetes we first create our cluster with **k3d**:
```bash
k3d cluster create -a 2
```
then we deploy our image from the repo:
```bash
kubectl create deployment logoutput --image=zelhs/project_server
```
we then list our pods and get it's logs:
```bash
kubectl get pods
kubectl logs applicationserver-69f8c59d6-477d9 # applicationserver-69f8c59d6-477d9 was my pod name
```
