<script>
    import { onMount } from "svelte"
    import { user } from "../user-store.js"
    import { navigate } from "svelte-routing"

    export let groupID
    let groupName = ""
    let error = ""

    let fileInput
    let files
    let avatar

    function getBase64(image) {
        const reader = new FileReader()
        reader.readAsDataURL(image)
        reader.onload = e => {
            avatar = e.target.result
        }
    }

    async function updateGroup(){
        error = ""

        const data = {
            groupName: groupName,
            imageData: avatar
        }

        const response = await fetch("http://localhost:8080/group/" + groupID + "/update?userID=" + $user.userID, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer "+$user.accessToken,
            },
            body: JSON.stringify(data)
        })

        if (response.status == 200) {
            navigate("/group/" + groupID)

        } else {
            const body = await response.json()
            error = body.error
        }
    }

    async function fetchGroupInfo(){
        error = ""

        const response = await fetch("http://localhost:8080/group/" + groupID + "?userID=" + $user.userID, {
            method: "GET",
            headers: {
                "Authorization": "Bearer "+$user.accessToken,
            },
        })

        const body = await response.json()

        if (response.status == 200) {
            groupName = body.group.name
            avatar = body.group.image
        } else {
            error = body.error
        }
    }

    onMount(async () => {
		fetchGroupInfo()
	})
</script>

<h1>Update Group</h1>

{#if avatar}
    <img class="avatar" src={avatar} alt="avatar"/>
{:else}
    <img class="avatar" src="/groupAvatar.png" alt="placeholder avatar"/>
{/if}

<p class="error-text">{error}</p>

<form on:submit|preventDefault={updateGroup}>

    <div>
        <label for="gimage">Group Image: </label>
        <input type="file" accept="image/jpeg, image/png" name="gimage" bind:files bind:this={fileInput} on:change={() => getBase64(files[0])}/>
    </div>

    <div>
        <label for="gname">Group Name: </label>
        <input type="text" name="gname" bind:value={groupName}/>
    </div>

    <button type="submit" class="submit-button">Update</button>
</form>