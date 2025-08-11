# Server application for 1.2 Exercise of Devops with Kubernetes

This application is written in node.js express, there is an image created with the
dockerfile [here]([https://hub.docker.com/repository/docker/zelhs/randomstring/general](https://hub.docker.com/repository/docker/zelhs/project_server/general)).

It creates a server that listens by default to port **4000**, or any you put to the env variable `PORT`

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

## For Declerative approach

Use the .yml file by executing:

```bash
kubectl apply -f manifest/Deployment.yml
```

and repeating the next steps to get the logs.

## Update 1.5

It also serves a static html page in the specified port

## Update 1.6

You need to first, create new cluster with open ports of the nodes as specified:

```bash
k3d cluster create --port 8082:30080@agent:0 -p 8081:80@loadbalancer --agents 2
```

then apply both `Deployment` and `Service` in the manifest file.

And you can access the static page with `http://localhost:8082`.

## Update 1.8

Because we used ClusterIP + Ingress to forward our 3000 port of the container to the cluster and to our local machine, we need to apply both services:

```bash
kubectl apply -f manifest
```

also now you can access the page from `http://localhost:8081`.

## Update 1.12

There is an addition of a cached image. It uses a persistent volume.
1. Create a `/imageCache` dir in the `/tmp/kube/` of the **k3d-k3s-default-agent-0** node.
2. You have to apply the PV and PVC first before applying the manifest:
   ```bash  
    kubectl apply -f persistentVolumes -f manifest
   ```

## Update 2.2

Added todo functionality, it uses persistent volume.
1. Also create a `/todos` dir in the `/tmp/kube/` of the **k3d-k3s-default-agent-0** node.

2. Apply it first the PV and PVC before applying the manifest:
   ```bash  
    kubectl apply -f persistentVolumes -f manifest
   ```

## Update 2.4

Seperated resources in a namespace `project`, you have to create it:

```bash
kubectl create namespace exercises
```

## update 2.8

Added a db to save τοδοσ. For that a `statefulset` service was added. You keed to first apply this,
with it secrets and headless service by:

```bash
kubectl apply -f porsgresServices -f manifest
```