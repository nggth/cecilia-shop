import Head from 'next/head'
import { useState, useContext, useEffect } from 'react'
import { DataContext } from '../store/GlobalState'
import Link from 'next/link'

import valid from '../utils/valid'
import { patchData } from '../utils/fetchData'

import { imageUpload } from '../utils/imageUpload'
import BackBtn from '../components/BackBtn'

const Profile = () => {
    const initialState = {
        avatar: '',
        name: '',
        password: '',
        cf_password: ''
    }
    const [ data, setData ] = useState(initialState)
    const { avatar, name, password, cf_password } = data

    const [state, dispatch] = useContext(DataContext)
    const { auth, notify, orders } = state

    useEffect(() => {
        if (auth.user) setData({...data, name: auth.user.name})
    }, [auth.user])

    const handleChange = (e) => {
        const { name, value } = e.target
        setData({...data, [name]: value})
        dispatch( { type: 'NOTIFY', payload: {} })
    }

    const handleUpdateProfile = e => {
        e.preventDefault()
        if (password) {
            const errMsg = valid(name, auth.user.email, password, cf_password)
            if (errMsg) return dispatch({ type: 'NOTIFY', payload: {error: errMsg} })
            updatePassword()
        }

        if (name === auth.user.name || avatar) updateInfor()
    }

    const updatePassword = () => {
        dispatch({ type: 'NOTIFY', payload: {loading: true} })
        patchData('user/resetPassword', {password}, auth.token)
        .then(res => {
            if(res.err) return dispatch({ type: 'NOTIFY', payload: {error: res.msg} })
            return dispatch({ type: 'NOTIFY', payload: {success: res.msg}})
        })
    }

    const changeAvatar = (e) => {
        const file = e.target.files[0]
        if (!file) 
            return dispatch ({ type: 'NOTIFY', payload: {error: 'File does not exist.'}})

        if (file.size > 1024 * 1024) //1mb 
            return dispatch ({ type: 'NOTIFY', payload: {error: 'The largest image size is 1mb.'}})
        
        if (file.type !== "image/jpeg" && file.type !== "image/png")
            return dispatch ({ type: 'NOTIFY', payload: {error: 'Image format is not supported.'}})

        setData({...data, avatar: file})
    }

    const updateInfor = async () => {
        let media
        dispatch({ type: 'NOTIFY', payload: {loading: true} })

        if (avatar) media = await imageUpload([avatar])

        patchData('user', {
            name, avatar: avatar ? media[0].url : auth.user.avatar
        }, auth.token).then(res => {
            if(res.err) return dispatch({ type: 'NOTIFY', payload: {error: res.err} })

            dispatch( { type: 'AUTH', payload: {
                token: auth.token,
                user: res.user
            }})
            return dispatch({ type: 'NOTIFY', payload: {success: res.msg} })

        })
    }

    if(!auth.user) return null

    return (
        <div className="profile_page">
            <Head>
                <title>Profile</title>
            </Head>
            <div className="row" style={{marginTop: '40px'}}>
                <div className="col-md-1">
                    <BackBtn />
                </div>
                <div className="col-md-3">
                    <div className="nav flex-column nav-pills" id="v-pills-tab" role="tablist" aria-orientation="vertical">
                        <a className="nav-link active" id="profile-tab" data-toggle="pill" href="#profile" role="tab" aria-controls="profile" aria-selected="false">Profile</a>
                        <a className="nav-link" id="orders-tab" data-toggle="pill" href="#orders" role="tab" aria-controls="orders" aria-selected="false">Orders</a>
                    </div>
                </div>
                <div className="col-md-8">
                    <div className="tab-content">
                    <div className="tab-pane fade show active" id="profile" role="tabpanel" aria-labelledby="profile-tab">
                        <h3 className="text-center text-uppercase">
                            {auth.user.role === 'user' ? 'User Profile' : 'Admin Profile'}
                        </h3>
                        <div className="avatar">
                            <img src={avatar ? URL.createObjectURL(avatar) : auth.user.avatar} alt="avatar" />
                            <span>
                                <i className="fas fa-camera"></i>
                                <p>Change</p>
                                <input type="file" name="file" id="file_up"
                                accept="image/*" onChange={changeAvatar} />
                            </span>
                        </div>

                        <div style={{margin: '0px 80px'}}>
                            <div className="form-group">
                                <label htmlFor="name">Name</label>
                                <input type="text" name="name" value={name}
                                    className="form-control" placeholder="Your name"
                                    onChange={handleChange} />
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <input type="text" name="email" defaultValue={auth.user.email}
                                    className="form-control" disabled={true} />
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <input type="password" name="password" value={password}
                                    className="form-control" placeholder="Your new password"
                                    onChange={handleChange} />
                            </div>

                            <div className="form-group">
                                <label htmlFor="cf_password">Confirm New Password</label>
                                <input type="password" name="cf_password" value={cf_password}
                                    className="form-control" placeholder="Confirm your password"
                                    onChange={handleChange} />
                            </div>

                            <button className="btn btn-info" disabled={notify.loading}
                                onClick={handleUpdateProfile}>
                                Update
                            </button>
                        </div>

                        
                    </div>
                    <div className="tab-pane fade" id="orders" role="tabpanel" aria-labelledby="orders-tab">
                        <div className="table-responsive">
                            <h3 className="text-center text-uppercase">Orders</h3>
                            <div className="my-3">
                                <table className="table-bordered table-hover w-100 text-uppercase"
                                    style={{minWidth: '600px', cursor: 'pointer'}}>
                                    <thead className="bg-light font-weight-bold">
                                        <tr>
                                            <td className="p-3"></td>
                                            <td className="p-3">id order</td>
                                            <td className="p-3">date</td>
                                            <td className="p-3">total</td>
                                            <td className="p-3">delivered</td>
                                            <td className="p-3">paid</td>
                                        </tr>
                                    </thead>

                                    <tbody>
                                    {
                                        orders.map((order, index) => (
                                            <Link href={`/order/${order._id}`} key={order._id}>
                                                <tr>
                                                    <td className="p-3">{index + 1}</td>
                                                    <td className="p-3"> {order._id}</td>
                                                    <td className="p-3">
                                                        {new Date(order.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="p-3">{order.total}</td>
                                                    <td className="p-3">
                                                        {
                                                            order.delivered
                                                            ? <i className="fas fa-check text-success"></i>
                                                            : <i className="fas fa-times text-danger"></i>
                                                        }
                                                    </td>
                                                    <td className="p-3">
                                                        {
                                                            order.paid
                                                            ? <i className="fas fa-check text-success"></i>
                                                            : <i className="fas fa-times text-danger"></i>
                                                        }
                                                    </td>
                                                </tr>
                                            </Link>
                                        ))
                                    }
                                    </tbody>
                                </table>

                            </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}

export default Profile