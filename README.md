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
kubectl apply -f porsgresServices -f persistentVolumes -f manifest
```

## update 3.9

### Comparison between DBaaS and DIY Db Solution

As described, there are different ways to compare the two approaches.
These are

1. The required work to initialize and run
2. Maintenance needed
3. Scalability, Availability
4. The cost of running

### 1. Work needed

1. For the `DBaaS`, the required work is mainly done in the GKE interface:

   We have to first Create a `Cloud SQL Instance`, we do so by:

   > Google Cloud Console > SQL > Create Instance and choosing PostgreSQL

   then whe define different things for where this service will be deployed. As i understand this runs outside our cluster, so we need to define **Instance ID**, the **Region-Zone**,
   **Machine type and storage**. At last there is an option for **High availability** but it's optional.

   Then we setup the postgres password 

   And lastly we configured the networking. A simple dolution i found was a **Private IP**.

   We enable **Private IP** on our Cloud SQL instance and ensure our GKE cluster nodes are on the same VPC/subnet.

   Use the private IP address like so:

   ```bash
   postgresql://postgres:MY_PASSWORD@10.23.45.67:5432/mydb
   ```

   then there are options for **automated backups**


2. For `DIY`, as we were taught, the best aproach is a `StatefulSet`. This ensures our data stays the same, because an identical pod will replace the previous and the volumes attached to it won't be deleted if pod is destroyed. The lifecycle is not attached to the pod.

   To create them, as described in class, we need to make a StatefulSet.yml file and an associate Headless service.

### 2. Maintenance needed

1. `DBaaS` does backup and provides availability by itself
2. `DIY` requires DevOps to take regular backups by themselves and observe for unexpected behaviour, but this can be done as we saw with `CronJobs` and other tools like `Promethius`, `Graphana` and `Loki`.

### 3. Scalability, Availability

1. `DBaaS` can support auto use a standby replica with High availability enabled, but even if not enabled Database is external to GKE, so nothing happens to our data if pod or node crashes. Even if cluster shutsdown the pods will connect to the service again.

   For Scalability, **not much is supported for horizontal scaling**, meaning multiple writable Postgres nodes, just read ones, but **vertical scaling** is very easy, we just defined it in the GKE interface.

2. `DYI`, the same works for availability, just there is no option for standby replica. The pods or Nodes will be down, but when kubernetes will spin up new ones the data will remane. Even if cluster is shutdown persistent sisks backing our PVCs are stored in Google Cloud independently of the cluster as stated in the class, so the new pods will just be reattached.

   For Scalability, **Vertical Scaling is again available** using Helm charts or editing the stateful set. But **horizontal scaling needs manual configuration even for read nodes**, it can be done but it needs experience DevOps.

### 4. Cost

The cost of `DBaaS` as we can see from the above comes down to the service cost, meaning fewer human actual developer costs.

The cost of `DYI` is the oposite, needing higher cost in developer but fewer in service.

One could argue that if we have a highly traffic app, we would need the `DBaas` to know we have the best approach and setup.

Even so, If we want to be flexible and custom we can use `DYI` and migrate easier to maybe another cloud or on premise. We just need to accept that constant monitoring-updating-backup will be needed. 

## Update 3.11

So the cluster i use is --disk-size=32 --num-nodes=3 --machine-type=e2-medium, this means
i use 2 vCpu cores, 4 GB RAM and 32 GB disk size. 

So each node = 2 vCPUs + 4 GiB RAM. Overall, 3 nodes, so **6 vCPUs + 12 GiB RAM**.

For CronJobs, since they run and stop, i setup loghtweight and done every 24hours:

1. for the db backup, since it's mostly I/O bound and network related

   Requests or min: 100m CPU (0.1 CPU) / 128Mi memory
   Limits or max: 300m CPU (0.3 CPU) / 256Mi memory

2. for the generation of todo, since it's mostly fetches and done every couple of minutes:

   Requests or min: 50m CPU (0.05 CPU) / 64Mi memory 
   Limits or max: 200m CPU (0.2 CPU) / 128Mi memory 

3. For todo service and express app that serves the Html and listens to endpoints i used a little bit more,
   just because node is single threaded:

   Requests or min: 200m CPU (0.2 CPU) / 256Mi memory 
   Limits or max: 500m CPU (0.5 CPU) / 512Mi memory 

4. For the db, statefulset i used a bit more, just because
   db's are very heavy on resources and might require caching:
   
   Requests or min: 500m CPU (0.5 CPU) / 512Mi memory
   Limits or max: 1 CPU / 1Gi memory

## Update 3.12

Logging is enabled by default in GKE, so if we navigate in `Logging` > `Logs Explorer`, we can see a todo 
be created as bellow

![logging image](./logging.png)

## Update 4.3

The requested query in promitheus

![promitheus query](./promitheus.png)

## Update 4.6

We need to also install the `official NATS` chart and `enable jetstream to use the queue mode` with:

```bash
helm install my-nats nats/nats --set config.jetstream.enabled=true --set config.jetstream.fileStore.pvc.size=1Gi -n project
```

then just deploy the kustomize, i use the hook to send images to artifact registry, but you can build image locally and upload to dockerHub

## Update 4.8

Applying GitOps in project appears to be a bit more difficult than log output.

The main principal is the same, but i choose to add **SOPS** with age for decryption/encryption. So we have to add **SOPS to the argocd**.

To do that I created a `custom argocd image` that can be created from:

> ./customArgoCd/Dockerfile

You build it and push it to a repo, then after you installed argocd, you add the credentials to a secret with:

```bash
kubectl -n argocd create secret docker-registry regcred  --docker-username=[user-name] --docker-password=[password] --docker-server=https://index.docker.io/v1/
```

You add it to the argocd repo server:

```bash
kubectl -n argocd patch deployment argocd-repo-server --type='json' -p='[{"op": "add", "path": "/spec/template/spec/imagePullSecrets", "value":[{"name":"regcred"}]}]'
```

You add the SOPS key from the file you have it:

```bash
kubectl create secret generic sops-age --namespace argocd --from-file=key.txt
```

You add it to the server as well: 

```bash
kubectl -n argocd patch deployment argocd-repo-server --type='strategic' -p "{\"spec\":{\"template\":{\"spec\":{\"containers\":[{\"name\":\"argocd-repo-server\",\"image\":\"zelhs/argocd-repo-server-sops:3\",\"volumeMounts\":[{\"name\":\"sops-age\",\"mountPath\":\"/home/argocd/.config/sops/age\"}],\"env\":[{\"name\":\"SOPS_AGE_KEY_FILE\",\"value\":\"/home/argocd/.config/sops/age/key.txt\"}]}],\"volumes\":[{\"name\":\"sops-age\",\"secret\":{\"secretName\":\"sops-age\"}}]}}}}"
```

and finaly, you tell argocd to decrypth the wanted files:

```bash
kubectl patch configmap argocd-cm -n argocd --type merge -p '
data:
  configManagementPlugins: |
    - name: sops
      generate:
        command: ["bash", "-c"]
        args:
          - |
            sops -d manifest/gcp-backup.secret.enc.yaml
            sops -d manifest/broadcasterSecret.enc.yml
'
```

the rest will be done when pushing changes and if you follow class instructions on how to setup autosync

## Update 4.9

The project had to be refactored as:

```yml
.
├── argocd
│   └── applications
│       ├── staging.yaml
│       └── production.yaml
├── manifest
│   ├── base
│   ├── ...resources .yml files
│   └── kustomization.yml
└── overlays
    ├── production
    │   ├── BackupTodoCronJob.yml
    │   └── kustomization.yml
    └── staging
        └── kustomization.yml
```

So we have to do the previous steps, don't forget NATS and then
apply the `argocd/applications`.

> Note that I had a problem with connecting as **non root** in the argocd
custom image, please edit the deployment of argocd-server and make it **false** to work.

> Also we need to change the path the Argocd's sops will decrypt our secrets, so please apply the correct path `manifest/base`:

```bash
kubectl patch configmap argocd-cm -n argocd --type merge -p '
data:
  configManagementPlugins: |
    - name: sops
      generate:
        command: ["bash", "-c"]
        args:
          - |
            sops -d manifest/base/gcp-backup.secret.enc.yaml
            sops -d manifest/base/broadcasterSecret.enc.yml
'
```

Then because we updated the main push action, it will commit and push the correct kustomization (tag -> production, else staging) and argocd will sync.
