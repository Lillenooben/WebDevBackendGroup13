<script>
    import { navigate } from "svelte-routing"
    import { user } from "../user-store.js"

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

    async function createGroup(){
        error = ""

        const data = {
            groupName: groupName,
        }

        if(avatar){
            data['imageData'] = avatar
        } else {
            data['imageData'] = ""
        }

        try {

            const response = await fetch("http://localhost:8080/group/create?userID=" + $user.userID, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer "+$user.accessToken,
                },
                body: JSON.stringify(data)
            })

            const body = await response.json()

            switch(response.status) {
                case 201:
                    navigate(`group/${body.newGroupID}`)
                    break
                case 400:
                    error = body.error
                    break
                case 401:
                    error = body.error
                    break
                case 500:
                    error = body.error
                    break
            }

        }catch(error){
            console.log(error)
        }

    }

</script>


<h1>Create Group</h1>

{#if avatar}
    <img class="avatar" src={avatar} alt="avatar"/>
{:else}
    <img class="avatar" src="/groupAvatar.png" alt="placeholder avatar"/>
{/if}

<p class="error-text">{error}</p>

<form on:submit|preventDefault={createGroup}>

    <div>
        <label for="gimage">Group Image: </label>
        <input type="file" accept="image/jpeg, image/png" name="gimage" bind:files bind:this={fileInput} on:change={() => getBase64(files[0])}/>
    </div>

    <div>
        <label for="gname">Group Name: </label>
        <input type="text" name="gname" bind:value={groupName}/>
    </div>

    <button type="submit" class="submit-button">Create</button>
</form>


<style>
    .avatar {
        object-fit: cover;
        border: 3px solid #213547;
        border-radius: 50%;
        height: 100px;
        width: 100px;
    }
    .error-text {
        color: red
    }
    input[type=text] {
        width: 19.1em;
        padding: 8px 14px;
        margin: 8px 0;
        box-sizing: border-box;
    }
    .submit-button {
        margin-top: 1em;
    }
</style>